import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  // Mengatur header CORS agar admin.html tidak terblokir browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let connection;

  try {
    // Mencoba membuka koneksi tunggal ke filess.io
    connection = await mysql.createConnection({
      host: "thr-49.h.filess.io",
      user: "room_bottlesea",
      password: "f09cf68286cbcbba65e8c8874450d82c1472af53",
      database: "room_bottlesea",
      port: 3306,
      connectTimeout: 10000 // Batas waktu tunggu koneksi 10 detik
    });

    // Melakukan query tes paling sederhana (tidak bergantung nama tabel)
    const [rows] = await connection.execute('SELECT 1 + 1 AS hasil');
    
    // Jika berhasil tersambung, kirim respon sukses
    return res.status(200).json({
      success: true,
      message: "Berhasil tersambung ke database filess.io!",
      data: rows
    });

  } catch (error) {
    // Jika gagal, tampilkan pesan error aslinya agar terlihat di Network Tab browser
    return res.status(500).json({
      success: false,
      message: "Koneksi database gagal dilakukan",
      error: error.message
    });
  } finally {
    // Pastikan koneksi selalu ditutup setelah selesai digunakan
    if (connection) {
      await connection.end();
    }
  }
}