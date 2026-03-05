const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));


mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/book_finder')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, required: true, min: 0, max: 5 },
  year: { type: Number, required: true }
});

const Book = mongoose.model('Book', bookSchema);


async function insertSampleBooks() {
  try {
    const count = await Book.countDocuments();
    if (count === 0) {
      console.log('No books found → inserting sample data...');

      const sampleBooks = [
        {
          title: "JavaScript: The Good Parts",
          author: "Douglas Crockford",
          category: "Programming",
          price: 599,
          rating: 4.6,
          year: 2008
        },
        {
          title: "Clean Code",
          author: "Robert C. Martin",
          category: "Programming",
          price: 720,
          rating: 4.7,
          year: 2008
        },
        {
          title: "The Pragmatic Programmer",
          author: "Andrew Hunt, David Thomas",
          category: "Programming",
          price: 850,
          rating: 4.8,
          year: 2019
        },
        {
          title: "Atomic Habits",
          author: "James Clear",
          category: "Self-Help",
          price: 499,
          rating: 4.8,
          year: 2018
        },
        {
          title: "Sapiens: A Brief History of Humankind",
          author: "Yuval Noah Harari",
          category: "Non-Fiction",
          price: 399,
          rating: 4.5,
          year: 2014
        }
      ];

      for (const book of sampleBooks) {
        const newBook = new Book(book);
        await newBook.save();
        console.log(`Book inserted: "${book.title}" by ${book.author} (${book.category}, ₹${book.price}, ★${book.rating})`);
      }

      console.log('All 5 sample books inserted successfully');
    } else {
      console.log(`Found ${count} existing books → skipping sample data insertion`);
    }
  } catch (err) {
    console.error('Error during sample books insertion:', err.message);
  }
}

mongoose.connection.once('open', () => {
  insertSampleBooks();
});

const ITEMS_PER_PAGE = 6;

app.get('/books', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const books = await Book.find()
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .sort({ title: 1 });

    const total = await Book.countDocuments();

    res.json({
      books,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/books/search', async (req, res) => {
  try {
    const title = req.query.title;
    if (!title) return res.json([]);

    const books = await Book.find({
      title: { $regex: title, $options: 'i' }
    }).sort({ title: 1 }).limit(20);

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/books/category/:cat', async (req, res) => {
  try {
    const category = req.params.cat;
    const books = await Book.find({ category })
      .sort({ title: 1 })
      .limit(20);

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/books/sort/:field', async (req, res) => {
  try {
    const field = req.params.field;
    let sort = {};

    if (field === 'price')       sort = { price: 1 };
    else if (field === 'price-desc') sort = { price: -1 };
    else if (field === 'rating')     sort = { rating: -1 };
    else return res.status(400).json({ error: 'Invalid sort field' });

    const books = await Book.find().sort(sort).limit(20);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/books/top', async (req, res) => {
  try {
    const books = await Book.find({ rating: { $gte: 4 } })
      .sort({ rating: -1 })
      .limit(5);

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
