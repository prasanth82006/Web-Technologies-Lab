const form = document.getElementById('noteForm');
const titleInput = document.getElementById('title');
const subjectInput = document.getElementById('subject');
const descInput = document.getElementById('description');
const noteIdInput = document.getElementById('noteId');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const notesList = document.getElementById('notesList');

const API_BASE = '/notes';

// Load all notes on page load
async function loadNotes() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const notes = await res.json();
    renderNotes(notes);
  } catch (err) {
    console.error('Error loading notes:', err);
    notesList.innerHTML = '<p style="color: red; text-align: center;">Failed to load notes</p>';
  }
}

function renderNotes(notes) {
  notesList.innerHTML = '';
  if (notes.length === 0) {
    notesList.innerHTML = '<p style="text-align: center; color: #777;">No notes yet. Add your first note!</p>';
    return;
  }

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-header">
        <div>
          <h3 class="note-title">${escapeHTML(note.title)}</h3>
          <div class="note-subject">${escapeHTML(note.subject)}</div>
        </div>
        <div class="note-actions">
          <button class="edit-btn" onclick="editNote('${note._id}')">Edit</button>
          <button class="delete-btn" onclick="deleteNote('${note._id}')">Delete</button>
        </div>
      </div>
      <p>${escapeHTML(note.description)}</p>
      <div class="date">Created: ${note.created_date}</div>
    `;
    notesList.appendChild(card);
  });
}

// Simple HTML escape function to prevent XSS
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Add or Update note
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const noteData = {
    title: titleInput.value.trim(),
    subject: subjectInput.value.trim(),
    description: descInput.value.trim()
  };

  // Basic client-side validation
  if (!noteData.title || !noteData.subject || !noteData.description) {
    alert('Please fill in all fields');
    return;
  }

  const id = noteIdInput.value.trim();

  try {
    let res;
    if (id) {
      // Update existing note
      res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    } else {
      // Create new note
      res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    }

    if (res.ok) {
      form.reset();
      noteIdInput.value = '';
      saveBtn.textContent = 'Add Note';
      cancelBtn.style.display = 'none';
      loadNotes();
    } else {
      const errorData = await res.json();
      alert(errorData.error || 'Error saving note');
    }
  } catch (err) {
    console.error('Save error:', err);
    alert('Network error - please check if server is running');
  }
});

// Load note data into form for editing
window.editNote = async function(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        alert('Note not found');
      } else {
        alert(`Error loading note (${res.status})`);
      }
      return;
    }

    const note = await res.json();

    titleInput.value = note.title || '';
    subjectInput.value = note.subject || '';
    descInput.value = note.description || '';
    noteIdInput.value = note._id;

    saveBtn.textContent = 'Update Note';
    cancelBtn.style.display = 'inline-block';

    // Scroll to top (form)
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('Edit fetch error:', err);
    alert('Could not load note for editing');
  }
};

// Delete note
window.deleteNote = async function(id) {
  if (!confirm('Are you sure you want to delete this note?')) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      loadNotes();
    } else {
      const errorData = await res.json();
      alert(errorData.error || 'Could not delete note');
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Network error during deletion');
  }
};

// Cancel editing
cancelBtn.addEventListener('click', () => {
  form.reset();
  noteIdInput.value = '';
  saveBtn.textContent = 'Add Note';
  cancelBtn.style.display = 'none';
});

// Initial load
loadNotes();