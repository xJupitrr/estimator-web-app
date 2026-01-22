# Limelight Design | Construction Cost Estimator

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

A premium, comprehensive web application designed for construction professionals to estimate material quantities and costs with high precision. Built with a focus on modern UI/UX and accurate engineering calculations.

## 🚀 Features

The application includes specialized modules for various construction phases:

- **🏗️ Structural Elements**:
  - **RC Footing**: Estimate concrete and reinforcement for structural foundations.
  - **RC Column**: Comprehensive rebar and concrete calculations for columns.
  - **RC Beam**: Detailed reinforcement estimation including support and midspan bars.
  - **Slab on Grade**: Area-based concrete and rebar mesh estimation.
- **🧱 Masonry & Finishes**:
  - **Masonry**: CHB (Concrete Hollow Block) counts with precise horizontal/vertical rebar calculations.
  - **Tile Works**: Material estimation for floor and wall tiling including grout and adhesive.
  - **Painting**: Surface area based estimation for primer, skim coat, and topcoats.
  - **Ceiling Works**: Drywall/ceiling panel counts with framing and fastener details.
- **🛠️ Support Works**:
  - **Formworks**: Automatically pulls data from Column/Beam modules to calculate required plywood and form lumbers.

## ✨ Key Functionalities

- **Smart Rebar Logic**: Accounts for commercial lengths (6m, 9m, 10.5m, 12m) and manages offcut reuse to reduce waste.
- **Export Capabilities**: 
  - 📋 **Copy to Clipboard**: Instant copying of formatted estimate tables.
  - 📥 **CSV Download**: Export your estimates directly to Excel-ready spreadsheets.
- **Premium UI**: 
  - Vibrant, color-coded modules for better visual organization.
  - Fully responsive design for use on-site or in the office.
  - Real-time updates as you input dimensions.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/estimator-web-app.git
   cd estimator-web-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📄 License

This project is intended for professional use by Limelight Design.

---
*Created with ❤️ for Limelight Design.*
