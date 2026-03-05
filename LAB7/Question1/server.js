const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_notes', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  created_date: { 
    type: String, 
    default: () => new Date().toISOString().split('T')[0] 
  }
});

const Note = mongoose.model('Note', noteSchema);
app.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ created_date: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching all notes:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/notes/:id', async (req, res) => {
  try {
    console.log('Requested single note ID:', req.params.id); 

    const note = await Note.findById(req.params.id);
    
    if (!note) {
      console.log('Note not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (err) {
    console.error('Error fetching single note:', err);
    res.status(500).json({ error: 'Server error while fetching note' });
  }
});
app.post('/notes', async (req, res) => {
  try {
    const note = new Note(req.body);
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(400).json({ error: err.message || 'Invalid note data' });
  }
});

app.put('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

app.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
