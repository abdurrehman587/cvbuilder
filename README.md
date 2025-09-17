# CV Builder Application

A modern web application for creating and managing CVs with role-based access control and dynamic table management for shopkeepers.

## 🚀 Features

### Core Functionality
- **Multi-role Authentication**: Users, Shopkeepers, and Admins
- **Dynamic Table Creation**: Each shopkeeper gets their own isolated CV table
- **Email Confirmation Bypass**: For development and testing
- **localStorage Fallback**: Offline authentication support
- **Real-time Database**: Powered by Supabase

### User Roles
- **Users**: Create and manage personal CVs
- **Shopkeepers**: Manage CVs for their shop with isolated tables
- **Admins**: Full system access and management

### CV Management
- **Template Support**: Multiple CV templates
- **Rich Content**: Education, experience, skills, certifications, projects
- **Image Upload**: Profile picture support
- **Export Options**: Download CVs in various formats

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with responsive design
- **JavaScript (ES6+)**: Modern JavaScript with async/await
- **Supabase JS**: Real-time database and authentication

### Backend
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Database
- **Row Level Security (RLS)**: Data isolation and security

### Development
- **Local Server**: Python HTTP server for development
- **Version Control**: Git with GitHub integration

## 📁 Project Structure

```
myapp/
├── frontend/                 # Frontend application
│   ├── css/                 # Stylesheets
│   │   ├── auth.css
│   │   ├── admin-dashboard.css
│   │   ├── shopkeeper-dashboard.css
│   │   └── styles.css
│   ├── js/                  # JavaScript modules
│   │   ├── auth.js          # Authentication system
│   │   ├── supabase-config.js
│   │   ├── supabase-database.js
│   │   ├── cv-builder.js
│   │   ├── admin-dashboard.js
│   │   └── shopkeeper-dashboard.js
│   ├── admin-dashboard.html  # Admin interface
│   ├── auth.html            # Authentication page
│   ├── index.html           # Main application
│   └── shopkeeper-dashboard.html
├── cv_builder_backend/      # Ruby on Rails backend (optional)
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd myapp
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key
   - Update `frontend/js/supabase-config.js` with your credentials

3. **Run the SQL setup**
   - Open Supabase SQL Editor
   - Run the SQL from `frontend/enable-dynamic-tables.sql`

4. **Start the development server**
   ```bash
   cd frontend
   python -m http.server 8080
   ```

5. **Open the application**
   - Navigate to `http://localhost:8080`
   - Start creating accounts and CVs!

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable Row Level Security (RLS)
3. Run the SQL setup script
4. Update configuration in `supabase-config.js`

### Database Tables
The application creates these tables automatically:
- `user_cvs`: User CVs
- `shopkeeper_cvs`: Main shopkeeper CVs
- `admin_cvs`: Admin CVs
- `shop_[shopname]_cvs`: Dynamic tables for each shop

## 👥 User Management

### Creating Accounts
1. **Users**: Sign up with email and password
2. **Shopkeepers**: Sign up with shop name (creates dynamic table)
3. **Admins**: Manual creation in Supabase

### Authentication Flow
1. **Primary**: Supabase authentication
2. **Fallback**: localStorage for development
3. **Email Confirmation**: Bypassed for development

## 🏪 Shopkeeper Features

### Dynamic Table Creation
- Each shopkeeper gets a unique table: `shop_[shopname]_cvs`
- Automatic table creation on signup
- Isolated data per shop
- Fallback to main table if needed

### CV Management
- Create, edit, and delete CVs
- Template selection
- Rich content editing
- Image upload support

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Shopkeepers can only access their shop's data
- Admins have full access

### Data Isolation
- Dynamic tables per shop
- User-specific data filtering
- Secure authentication

## 🚀 Deployment

### GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to main branch
4. Update Supabase configuration for production

### Other Hosting
- Upload `frontend/` folder to any web server
- Ensure HTTPS for Supabase integration
- Update CORS settings in Supabase

## 🐛 Troubleshooting

### Common Issues
1. **Email confirmation errors**: Use localStorage fallback
2. **Table creation fails**: Check Supabase permissions
3. **CORS errors**: Update Supabase settings
4. **Authentication fails**: Check console for errors

### Debug Mode
- Open browser developer tools
- Check console for detailed logs
- Verify Supabase connection

## 📝 Development Notes

### Code Structure
- **Modular JavaScript**: Separate files for different functionalities
- **ES6 Classes**: Object-oriented approach
- **Async/Await**: Modern asynchronous programming
- **Error Handling**: Comprehensive error management

### Database Design
- **Normalized Structure**: Efficient data storage
- **JSONB Fields**: Flexible content storage
- **Timestamps**: Automatic created/updated tracking
- **Foreign Keys**: Data integrity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the console logs
- Create an issue in the repository

## 🎯 Roadmap

### Planned Features
- [ ] Email confirmation system
- [ ] CV export to PDF
- [ ] Advanced templates
- [ ] Mobile app
- [ ] API documentation
- [ ] Unit tests

---

**Happy CV Building! 🎉**


