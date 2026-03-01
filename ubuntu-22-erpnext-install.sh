#!/bin/bash
# ERPNext Installation Script for Ubuntu 22.04
# Run as: sudo bash ubuntu-22-erpnext-install.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     ERPNext Installation for Ubuntu 22.04 LTS                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Update System
echo "1️⃣  Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Step 2: Install Prerequisites
echo "2️⃣  Installing prerequisites..."
sudo apt install -y \
    python3-dev \
    python3-pip \
    python3-venv \
    redis-server \
    mariadb-server \
    nginx \
    git \
    curl \
    supervisor \
    software-properties-common \
    libmysqlclient-dev

# Step 3: Install Node.js 18
echo "3️⃣  Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Step 4: Configure MariaDB
echo "4️⃣  Configuring MariaDB..."

# Create MariaDB config file
sudo tee -a /etc/mysql/mariadb.conf.d/erpnext.cnf > /dev/null <<MARIADB_CONFIG
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
MARIADB_CONFIG

# Restart MariaDB
sudo systemctl restart mariadb
sudo systemctl enable mariadb

echo "✅ MariaDB configured"

# Step 5: Install Frappe Bench
echo "5️⃣  Installing Frappe Bench..."
sudo pip3 install frappe-bench

# Step 6: Initialize Bench
echo "6️⃣  Initializing Frappe Bench (this takes 5-10 minutes)..."
bench init frappe-bench --frappe-branch version-14 --verbose

cd frappe-bench

# Step 7: Get ERPNext
echo "7️⃣  Getting ERPNext (this takes 5-10 minutes)..."
bench get-app erpnext --branch version-14

# Step 8: Get HRMS
echo "8️⃣  Getting HRMS..."
bench get-app hrms

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     ✅ INSTALLATION COMPLETE!                                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. cd frappe-bench"
echo "2. Create site with provided script"
echo ""

