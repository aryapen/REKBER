const mysql = require("mysql2");

// Kredensial Filess.io milikmu
const con = mysql.createConnection({
  host: "thr-49.h.filess.io",
  user: "room_bottlesea",
  password: "f09cf68286cbcbba65e8c8874450d82c1472af53",
  database: "room_bottlesea",
  port: "3306",
});

export default function handler(req, res) {
  // Aktifkan CORS agar HTML kamu bisa akses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  // 1. GET: AMBIL SEMUA ROOM ATAU SATU ROOM BERDASARKAN QUERY / ID
  if (req.method === "GET") {
    if (req.query.roomCode) {
      con.query("SELECT * FROM rooms WHERE roomCode = ?", [req.query.roomCode], (err, results) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(results);
      });
    } else if (id) {
      con.query("SELECT * FROM rooms WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Room tidak ketemu" });
        return res.status(200).json(results[0]);
      });
    } else {
      con.query("SELECT * FROM rooms", (err, results) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(results);
      });
    }
  }

  // 2. POST: BUAT ROOM BARU
  else if (req.method === "POST") {
    const r = req.body;
    const query = "INSERT INTO rooms (roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [r.roomCode, r.game, r.price, r.buyer_wallet, r.status, r.akun_id, r.akun_pass, r.akun_req, r.loc_buyer, r.loc_seller];
    
    con.query(query, values, (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ id: result.insertId, ...r });
    });
  }

  // 3. PUT: UPDATE DATA ROOM
  else if (req.method === "PUT") {
    const dataBaru = req.body;
    con.query("UPDATE rooms SET ? WHERE id = ?", [dataBaru, id], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ success: true, message: "Data terupdate!" });
    });
  }
}