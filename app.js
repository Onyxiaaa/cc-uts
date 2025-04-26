require('dotenv').config();  // Menambahkan dotenv

const express = require('express');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
const port = 3000;

// Konfigurasi CORS agar frontend bisa akses backend
app.use(cors({
  origin: 'http://127.0.0.1:5500' // Ganti dengan IP atau domain frontend kamu
}));

// Konfigurasi AWS S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION, // Menggunakan environment variable
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,  // Menggunakan environment variable
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY   // Menggunakan environment variable
});

const bucketName = process.env.BUCKET_NAME; // Menggunakan environment variable

// Konfigurasi koneksi database MySQL RDS
const db = mysql.createConnection({
  host: process.env.DB_HOST,       // Menggunakan environment variable
  user: process.env.DB_USER,        // Menggunakan environment variable
  password: process.env.DB_PASSWORD,    // Menggunakan environment variable
  database: process.env.DB_NAME   // Menggunakan environment variable
});

db.connect(err => {
  if (err) {
    console.error('Gagal koneksi ke database:', err);
  } else {
    console.log('Terhubung ke database MySQL RDS');
  }
});

// Endpoint API untuk mengambil data produk
app.get('/api/produk', (req, res) => {
  const query = 'SELECT id, nama_produk, harga, gambar_key FROM produk';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil data produk' });
    }

    // Buat array produk dengan URL gambar dari S3
    const produk = results.map(item => {
      const gambarUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: item.gambar_key,
        Expires: 60 * 60 // URL berlaku 1 jam
      });

      return {
        id: item.id,
        nama: item.nama_produk,
        harga: item.harga,
        gambar: gambarUrl
      };
    });

    res.json(produk);
  });
});

app.listen(port, () => {
  console.log(`Backend berjalan di http://localhost:${port}`);
});
