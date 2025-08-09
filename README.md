## E‑Commerce Website (Node.js + Express + MySQL)

A simple, resume‑ready e‑commerce demo built with Node.js, Express, and MySQL. It supports user registration/login, a protected shop page with products, and placing orders by inserting rows directly into `order_items` (no `orders` table required if you prefer it that way).

### Features
- User registration and login with password hashing (`bcrypt`)
- Session‑based authentication; unauthenticated users are redirected to `/login`
- Protected shop page (`/shop`) with product listing fetched from `/api/products`
- Place orders via `/order` which writes directly to `order_items`
- Static frontend pages under `public/` (login, register, shop)

### Tech Stack
- Express, mysql2, express‑session, bcrypt
- Vanilla HTML/CSS/JS

### Project Structure
```
public/
  index.html
  login.html
  register.html
  shop.html
  css/
  js/
server.js
db.js (if present in earlier versions; current code uses inline connection)
seed.sql (optional starter schema/data)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL Server 8+

### 1) Install dependencies
```
npm install
```

### 2) Environment variables
Create a `.env` file in the project root:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=ecommerce_db
SESSION_SECRET=change_me
```

### 3) Database setup
Create your database (once):
```
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce_db;"
```

You have two options for `order_items` schema:

#### Option A (Recommended, no orders table)
Use a `user_id` column in `order_items` and drop any FK to `orders`:
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(512),
  description TEXT,
  category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```
The server will insert into `order_items (user_id, product_id, quantity, unit_price)`.

#### Option B (If you keep an orders table)
If you decide to keep an `orders` table, adjust the `/order` route accordingly (earlier versions inserted into `orders` then `order_items`). The current code favors Option A.

### 4) Seed sample products (optional)
Insert a few products so the shop has data:
```sql
INSERT INTO products (name, price, image_url, description, category) VALUES
('Navy Blue Cotton T-Shirt', 20.00, '/images/ChrisCrossNavyBlueCottonT-Shirt.webp', 'Soft cotton tee in navy blue', 'T-Shirts'),
('Blue Jeans', 40.00, '/images/Blue Jeans.jpg', 'Classic straight-fit jeans', 'Jeans'),
('Black Jacket', 60.00, '/images/jacket.jpeg', 'Lightweight black jacket', 'Jackets');
```

Tip: You can also adapt the provided `seed.sql` or execute the statements above via MySQL Workbench/CLI.

## Run the app
```
npm start
```
Open `http://localhost:5000` → you will be redirected to `/login`.

## Usage
1) Register at `/register` (creates a row in `users`)
2) Login at `/login`
3) Go to `/shop` (protected)
   - Products load via `/api/products`
   - Order from a product card or use the manual product + quantity form

## Endpoints
- `GET /` → redirects to `/login` unless authenticated
- `GET /login` → login page
- `POST /login` → verifies credentials; sets session; redirects to `/shop`
- `GET /register` → register page
- `POST /register` → creates user; redirects to `/login`
- `POST /logout` → destroys session; redirects to `/login`
- `GET /shop` (auth) → shop page (static)
- `GET /api/products` (auth) → returns all products (JSON)
- `POST /order` (auth)
  - Body: `product_id`, `quantity` (form or JSON)
  - Looks up product price and inserts into `order_items`
  - If `order_items.user_id` exists, uses it (recommended schema)

## Troubleshooting
- Auth redirects to `/login` repeatedly
  - Check that registration worked (user exists in `users`) and that sessions are enabled
- 500 errors on `/login` or `/register`
  - Confirm DB connection and that `users` table exists in the DB pointed to by `.env`
- Ordering fails
  - Make sure `products` has data
  - Make sure your `order_items` schema matches Option A above (has `user_id`)

## License
MIT

