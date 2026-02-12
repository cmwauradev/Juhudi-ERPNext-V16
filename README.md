# Frappe Bench - ERPNext & HRMS Installation

This is a Frappe Bench installation with ERPNext and HRMS applications.

## Installed Applications

- **Frappe Framework** v16.6.0 - Core framework
- **ERPNext** v16.5.0 - Complete ERP solution
- **HRMS** v16.4.0 - Human Resources Management System

## Sites

### localhost
- **URL:** http://localhost:8000
- **Admin Username:** Administrator
- **Apps:** frappe, erpnext, hrms

### mysite.local
- **URL:** http://mysite.local:8000
- **Admin Username:** Administrator
- **Apps:** frappe, erpnext, hrms

## Database Configuration

- **Database:** MariaDB 12.1.2
- **Port:** 1905
- **Host:** 127.0.0.1

## Services

- Web Server: Port 8000
- Socket.IO: Port 9000
- Redis Cache: Port 13000
- Redis Queue: Port 11000

## Setup Instructions

### Prerequisites
- Python 3.14+
- Node.js & Yarn
- MariaDB 12.1.2
- Redis

### Running the Bench

```bash
cd frappe-bench
bench start
```

### Accessing the Sites

#### For localhost site:
Simply navigate to http://localhost:8000

#### For mysite.local site:
Add to /etc/hosts:
```
127.0.0.1 mysite.local
```
Then navigate to http://mysite.local:8000

## Common Commands

```bash
# Start the bench
bench start

# Create a new site
bench new-site sitename.local --admin-password [password]

# Install an app
bench --site sitename.local install-app [app-name]

# List all sites
bench --site all list-apps

# Backup a site
bench --site sitename.local backup

# Update bench
bench update
```

## Notes

- Site configurations are stored in `sites/[sitename]/site_config.json`
- Database credentials are auto-generated during site creation
- Scheduler is disabled by default for development
- This is a development setup - for production, use proper configuration

## License

This bench installation uses Frappe, ERPNext, and HRMS which are licensed under GNU General Public License v3.0
