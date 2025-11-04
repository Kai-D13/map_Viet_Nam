# 🇻🇳 Vietnam Logistics Heatmap

> **Interactive heatmap visualization for Vietnam logistics data with Kepler.gl-inspired design**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](http://localhost:5173/?country=vietnam)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![Mapbox](https://img.shields.io/badge/Mapbox-GL-4264fb.svg)](https://www.mapbox.com/)

![Vietnam Logistics Heatmap](https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=Vietnam+Logistics+Heatmap)

---

## 🌟 Features

### 📊 Visualization
- **🔥 Heatmap** - Red → Orange → Yellow gradient (Kepler.gl style)
- **📍 Clustering** - Smart grouping with destination count + total orders
- **🎯 Individual Points** - Toggle 6,542 destinations on/off
- **🗺️ District Boundaries** - Vietnam administrative borders overlay

### 🎛️ Interactive Controls
- **🏙️ Province Filter** - Select province → auto-zoom to region
- **📈 Order Range Filter** - Min/max sliders for order volume
- **🔍 Search** - Find specific addresses
- **👁️ Layer Toggle** - Show/hide heatmap, clusters, markers, boundaries

### 📈 Statistics Dashboard
- **Total Destinations:** 6,542
- **Total Orders:** 120,805
- **Top 10 Provinces** - Clickable list with order counts
- **Real-time Updates** - Stats change with filters

### 🎨 Design
- **Dark Theme** - Professional Kepler.gl-inspired interface
- **Responsive** - Works on desktop, tablet, mobile
- **Fast Performance** - Optimized for 6,500+ data points
- **Clean UI** - Minimal, focused on data

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Mapbox access token (free tier available)

### Installation

```bash
# Clone repository
git clone https://github.com/Kai-D13/map_Viet_Nam.git
cd map_Viet_Nam

# Install dependencies
npm install

# Create .env file with your Mapbox token
echo "VITE_MAPBOX_TOKEN=your_mapbox_token_here" > .env

# Run development server
npm run dev
```

### Access the App
```
http://localhost:5173/?country=vietnam
```

---

## 📊 Data Overview

### Geocoding Results
- ✅ **6,542/6,543** destinations successfully geocoded (99.98%)
- ✅ **120,805** total orders across all destinations
- ✅ **63 provinces** covered
- ✅ **Average accuracy:** 0.7959
- ❌ **1 failed:** Côn Đảo island (0.02%)

### Top 5 Provinces by Orders
1. **TP. Hồ Chí Minh** - 18,815 orders
2. **TP. Hà Nội** - 7,499 orders
3. **Đồng Nai** - 5,470 orders
4. **Kiên Giang** - 4,847 orders
5. **Bình Dương** - 4,386 orders

---

## 🎨 Color Scheme (Kepler.gl Style)

### Heatmap Gradient
```
Dark Red → Firebrick → Crimson → Red-Orange → Tomato → 
Dark Orange → Orange → Gold → Yellow → Light Yellow
```

| Density | Color | Hex | Description |
|---------|-------|-----|-------------|
| 0-10% | Dark Red | `#8B0000` | Very low density |
| 10-30% | Crimson | `#DC143C` | Low density |
| 30-50% | Red-Orange | `#FF4500` | Medium density |
| 50-70% | Orange | `#FFA500` | High density |
| 70-90% | Gold | `#FFD700` | Very high density |
| 90-100% | Light Yellow | `#FFFFE0` | **Maximum density** |

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **Vite 5.4.2** - Build tool
- **Mapbox GL JS 3.7.0** - Map rendering
- **JavaScript (ES6+)** - Programming language

### Data Processing
- **Python 3.x** - Geocoding scripts
- **Mapbox Geocoding API** - Address → coordinates
- **Goong API** - Fallback geocoding for Vietnam

### Data Sources
- **GADM 4.1** - Vietnam district boundaries (GeoJSON)
- **Custom Dataset** - 6,543 logistics destinations from Excel

---

## 📁 Project Structure

```
map_Viet_Nam/
├── src/
│   ├── App.jsx                      # Main app with routing
│   ├── main.jsx                     # Entry point
│   ├── VietnamApp.jsx               # Vietnam main component
│   └── components/
│       ├── VietnamMap.jsx           # Map with heatmap/clusters
│       ├── VietnamDashboard.jsx     # Sidebar with filters
│       ├── PasswordProtection.jsx   # Authentication
│       └── CountrySwitcher.jsx      # Country switcher
├── public/
│   ├── vietnam_destinations.json    # 6,542 geocoded destinations
│   └── vietnam_districts.json       # District boundaries
├── geocode_vietnam_auto.py          # Auto geocoding script
├── analyze_vietnam_data.py          # Data analysis
└── README.md                        # This file
```

---

## 🎯 Use Cases

### 1. Logistics Planning
- Identify high-demand areas (bright yellow hotspots)
- Find optimal hub locations (large clusters)
- Analyze regional distribution

### 2. Market Analysis
- Compare order volumes across provinces
- Discover underserved regions
- Track geographic trends

### 3. Route Optimization
- Visualize delivery density
- Plan efficient routes
- Allocate resources by region

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Mapbox Access Token (required)
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here

# Password Protection (optional)
VITE_ACCESS_PASSWORD=logistics2025
```

### Mapbox Token
Get a free token at [mapbox.com/signup](https://account.mapbox.com/auth/signup/)

---

## 📖 Documentation

- **[Quick Start Guide](QUICK_START_VIETNAM.md)** - Get started in 5 minutes
- **[System Guide](VIETNAM_SYSTEM_GUIDE.md)** - Complete feature documentation
- **[Features Completed](VIETNAM_FEATURES_COMPLETED.md)** - Feature list
- **[Kepler.gl Style Updates](KEPLER_STYLE_UPDATES.md)** - Design inspiration
- **[Final Deployment](FINAL_DEPLOYMENT.md)** - Deployment details

---

## 🎮 How to Use

### Basic Navigation
1. **Zoom** - Scroll wheel or +/- buttons
2. **Pan** - Click and drag
3. **Rotate** - Right-click and drag (or Ctrl + drag)

### Filters
1. **Province Filter** - Click province in Top 10 list or use dropdown
2. **Order Range** - Drag sliders to filter by order volume
3. **Clear Filters** - Click "Clear" button

### Layers
- **Heatmap** - Toggle to show/hide density visualization
- **Clusters** - Toggle to show/hide grouped points
- **Individual Points** - Toggle to show/hide all 6,542 destinations
- **District Boundaries** - Toggle to show/hide administrative borders

### Tips
- 💡 **Red zones** = Low orders, **Yellow zones** = High orders
- 💡 **Large clusters** = Potential hub locations
- 💡 **Click clusters** to zoom in
- 💡 **Click markers** to see details

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run build
# Push dist/ folder to gh-pages branch
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Kepler.gl](https://kepler.gl)** - Design inspiration
- **[Mapbox](https://www.mapbox.com/)** - Map rendering and geocoding
- **[GADM](https://gadm.org/)** - Vietnam administrative boundaries
- **[Goong](https://goong.io/)** - Vietnam geocoding fallback

---

## 📧 Contact

**Project Maintainer:** Kai-D13

**Repository:** [github.com/Kai-D13/map_Viet_Nam](https://github.com/Kai-D13/map_Viet_Nam)

**Issues:** [github.com/Kai-D13/map_Viet_Nam/issues](https://github.com/Kai-D13/map_Viet_Nam/issues)

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/Kai-D13/map_Viet_Nam?style=social)
![GitHub forks](https://img.shields.io/github/forks/Kai-D13/map_Viet_Nam?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Kai-D13/map_Viet_Nam?style=social)

---

<div align="center">

**Made with ❤️ for Vietnam Logistics**

[⬆ Back to Top](#-vietnam-logistics-heatmap)

</div>

