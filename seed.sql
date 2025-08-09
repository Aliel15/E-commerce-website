-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(512),
  description TEXT,
  category VARCHAR(100)
);

-- Create users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);






CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed sample products
INSERT INTO products (name, price, image_url, description, category) VALUES
('Navy Blue Cotton T-Shirt', 20.00, '/images/ChrisCrossNavyBlueCottonT-Shirt.webp', 'Soft cotton tee in navy blue', 'T-Shirts'),
('Blue Jeans', 40.00, '/images/Blue Jeans.jpg', 'Classic straight-fit jeans', 'Jeans'),
('Black Jacket', 60.00, '/images/jacket.jpeg', 'Lightweight black jacket', 'Jackets');

