const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Підключення до MongoDB
const DB_URI = 'mongodb+srv://Admin:Admin@cluster0.zf8hb.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0'; // Замініть на ваш URI
mongoose.connect(DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Схема і модель для товарів
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: 'Не знайдено' },
});

const Product = mongoose.model('Product', productSchema);

// Функція нормалізації тексту
const normalize = (str) => str?.trim().toLowerCase().replace(/\s+/g, '');

// Віддача статичних файлів із директорії public
app.use(express.static('public'));

// Маршрут для головної сторінки
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Роут для завантаження файлів
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Перевірка типу файлу
    const fileType = req.file.mimetype;
    if (fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return res.status(400).send('Invalid file type. Please upload an Excel file.');
    }

    // Читання Excel-файлу
    const filePath = path.join(__dirname, req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const productsFromFile = xlsx.utils.sheet_to_json(sheet);

    console.log('Products from uploaded file:', productsFromFile);

    // Отримання всіх товарів із бази даних
    const productsFromDB = await Product.find();
    const productCodes = {};

    productsFromDB.forEach((product) => {
      productCodes[normalize(product.name)] = product.code;
    });

    console.log('Products from database:', productCodes);

    // Оновлення товарів із бази даних
    productsFromFile.forEach((product) => {
      const productName = normalize(product['Найменування'] || product['A']); // Використовуйте правильний ключ
      if (productCodes[productName]) {
        product['Код'] = productCodes[productName];
      } else {
        product['Код'] = 'Не знайдено';
      }
    });

    console.log('Updated products:', productsFromFile);

    // Створення нового Excel-файлу
    const newSheet = xlsx.utils.json_to_sheet(productsFromFile, { header: ['Найменування', 'Код'] });
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'UpdatedProducts');

    const newFilePath = path.join(__dirname, 'updated_products.xlsx');
    xlsx.writeFile(newWorkbook, newFilePath);
    console.log('New file created:', newFilePath);

    // Відправка файлу назад клієнту
    res.download(newFilePath, 'updated_products.xlsx', () => {
      fs.unlinkSync(filePath); // Видалення тимчасового файлу
      fs.unlinkSync(newFilePath); // Видалення оновленого файлу
    });
  } catch (error) {
    console.error('Error processing the file:', error);
    res.status(500).send('Error processing the file');
  }
});

// Роут для оновлення бази даних із нового Excel-файлу
app.post('/update-database', upload.single('file'), async (req, res) => {
  try {
    // Читання Excel-файлу
    const filePath = path.join(__dirname, req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const productsFromFile = xlsx.utils.sheet_to_json(sheet);

    // Додавання/оновлення товарів у базі даних
    for (const product of productsFromFile) {
      const productName = normalize(product['Найменування'] || product['A']);
      await Product.findOneAndUpdate(
        { name: productName },
        { name: productName, code: product['Код'] || 'Не знайдено' },
        { upsert: true }
      );
    }

    fs.unlinkSync(filePath); // Видалення тимчасового файлу
    res.send('Database updated successfully');
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).send('Error updating database');
  }
});

// Запуск сервера
const PORT = 4444;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
