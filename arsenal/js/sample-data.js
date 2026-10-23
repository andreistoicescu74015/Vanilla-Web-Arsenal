/*
  Demo content that works offline: realistic sample data and generated placeholder images.
  Better than lorem ipsum for a demo, because judges read it.

    VWA.sample.users, VWA.sample.products, VWA.sample.tasks, VWA.sample.posts

    <img data-placeholder="Product photo" width="800" height="500" alt="">
      gets a soft single-color SVG image with that label (no internet needed)
    VWA.placeholderImage({ width: 800, height: 500, text: "Hero", hue: 250 })
      returns the same image as a data: URL for <img src> or CSS url()
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  VWA.sample = {
    users: [
      { id: 1, name: "Ana Popescu", email: "ana.popescu@example.com", role: "Designer", city: "Bucharest", joined: "2026-02-14", active: true },
      { id: 2, name: "Mihai Ionescu", email: "mihai.ionescu@example.com", role: "Frontend developer", city: "Cluj-Napoca", joined: "2026-03-02", active: true },
      { id: 3, name: "Elena Dumitru", email: "elena.dumitru@example.com", role: "Product manager", city: "Iasi", joined: "2025-11-20", active: false },
      { id: 4, name: "Andrei Stan", email: "andrei.stan@example.com", role: "Backend developer", city: "Timisoara", joined: "2026-05-09", active: true },
      { id: 5, name: "Ioana Marin", email: "ioana.marin@example.com", role: "Data analyst", city: "Brasov", joined: "2026-01-27", active: true },
      { id: 6, name: "Radu Georgescu", email: "radu.georgescu@example.com", role: "Mobile developer", city: "Constanta", joined: "2025-09-15", active: false },
      { id: 7, name: "Maria Constantin", email: "maria.constantin@example.com", role: "QA engineer", city: "Sibiu", joined: "2026-06-30", active: true },
      { id: 8, name: "Vlad Petrescu", email: "vlad.petrescu@example.com", role: "DevOps engineer", city: "Oradea", joined: "2026-04-11", active: true },
    ],

    products: [
      { id: 1, name: "Trail Runner 2", category: "Shoes", price: 89.9, rating: 4.6, reviews: 214, stock: 32, badge: "Bestseller", hue: 200, description: "A light trail shoe with a grippy sole and a wide toe box, for long days on rocky paths." },
      { id: 2, name: "Everyday Backpack 20L", category: "Bags", price: 64.5, rating: 4.8, reviews: 98, stock: 12, badge: "New", hue: 30, description: "Fits a 15-inch laptop, a jacket and lunch. Water-resistant fabric and a padded back." },
      { id: 3, name: "Merino Crew Socks", category: "Clothing", price: 14.0, rating: 4.4, reviews: 410, stock: 120, badge: null, hue: 330, description: "Soft merino wool that stays warm when wet and does not smell after a long hike." },
      { id: 4, name: "Insulated Bottle 750ml", category: "Accessories", price: 24.9, rating: 4.7, reviews: 156, stock: 0, badge: null, hue: 170, description: "Keeps water cold for 24 hours and tea hot for 12. Fits most car cup holders." },
      { id: 5, name: "Rain Shell Jacket", category: "Clothing", price: 129.0, rating: 4.5, reviews: 77, stock: 8, badge: "Limited", hue: 220, description: "Waterproof, breathable and packs into its own pocket. Taped seams and a stiff hood brim." },
      { id: 6, name: "Trekking Poles (pair)", category: "Accessories", price: 49.0, rating: 4.3, reviews: 63, stock: 25, badge: null, hue: 90, description: "Aluminium poles that fold to 38 cm, with cork grips and quick-lock adjustment." },
      { id: 7, name: "Sun Hat Wide Brim", category: "Clothing", price: 22.5, rating: 4.1, reviews: 39, stock: 41, badge: null, hue: 45, description: "UPF 50 fabric, a chin strap for windy ridges, and a brim that keeps its shape." },
      { id: 8, name: "Headlamp 400 Lumen", category: "Accessories", price: 34.9, rating: 4.9, reviews: 188, stock: 17, badge: "Top rated", hue: 260, description: "USB-C rechargeable, red night mode, and 40 hours on the lowest setting." },
      { id: 9, name: "Approach Shoe Low", category: "Shoes", price: 119.0, rating: 4.6, reviews: 52, stock: 14, badge: null, hue: 15, description: "Sticky rubber for scrambling and a stiff edge for climbing, comfortable enough to walk all day." },
      { id: 10, name: "Daypack 12L", category: "Bags", price: 39.9, rating: 4.2, reviews: 71, stock: 33, badge: null, hue: 150, description: "A minimal pack for short walks and city days, with a hip belt you can tuck away." },
      { id: 11, name: "Fleece Midlayer", category: "Clothing", price: 59.0, rating: 4.7, reviews: 133, stock: 22, badge: null, hue: 280, description: "Warm grid fleece that breathes when you climb and dries fast after rain." },
      { id: 12, name: "Camp Mug 350ml", category: "Accessories", price: 12.5, rating: 4.5, reviews: 207, stock: 64, badge: null, hue: 350, description: "Double-wall steel with a lid that seals. Coffee stays hot while you watch the sunrise." },
      { id: 13, name: "Gaiters Waterproof", category: "Accessories", price: 29.0, rating: 4.0, reviews: 28, stock: 9, badge: null, hue: 120, description: "Keep snow, mud and stones out of your boots. Fit over most hiking shoes." },
      { id: 14, name: "Hiking Boot Mid", category: "Shoes", price: 149.0, rating: 4.8, reviews: 166, stock: 6, badge: "Bestseller", hue: 25, description: "Ankle support, a waterproof membrane and a sole that works on wet rock." },
      { id: 15, name: "Duffel 40L", category: "Bags", price: 79.0, rating: 4.6, reviews: 58, stock: 0, badge: null, hue: 190, description: "Tough coated fabric, backpack straps and a wide opening for travel and gear." },
      { id: 16, name: "Thermal Leggings", category: "Clothing", price: 34.0, rating: 4.3, reviews: 95, stock: 47, badge: "New", hue: 240, description: "A warm base layer for cold mornings. Flat seams, so nothing rubs under trousers." },
    ],

    tasks: [
      { id: 6, title: "Record the 2 minute demo video", done: false, priority: "high", due: "2026-10-25", tag: "Pitch" },
      { id: 5, title: "Write the README and setup steps", done: false, priority: "medium", due: "2026-10-25", tag: "Docs" },
      { id: 4, title: "Add empty and error states to the list", done: false, priority: "medium", due: "2026-10-24", tag: "Frontend" },
      { id: 3, title: "Check contrast and keyboard navigation", done: true, priority: "high", due: "2026-10-24", tag: "Accessibility" },
      { id: 2, title: "Build the landing page hero", done: true, priority: "low", due: "2026-10-24", tag: "Frontend" },
      { id: 1, title: "Pick a name and a brand color", done: true, priority: "low", due: "2026-10-24", tag: "Design" },
    ],

    posts: [
      { id: 1, title: "Flexbox in ten minutes", excerpt: "The two axes, the five properties you use every day, and the one-line fix for overflowing children.", author: "Ana Popescu", date: "2026-09-12", tags: ["CSS", "Layout"], minutes: 10 },
      { id: 2, title: "Designing empty states that help", excerpt: "An empty screen is a chance to explain what the page is for and what to do first.", author: "Elena Dumitru", date: "2026-08-30", tags: ["UX"], minutes: 6 },
      { id: 3, title: "A router in forty lines of JavaScript", excerpt: "Hash changes, a table of patterns, and a function per page: the core of every SPA router.", author: "Mihai Ionescu", date: "2026-08-02", tags: ["JavaScript"], minutes: 8 },
      { id: 4, title: "Color contrast without guesswork", excerpt: "What 4.5:1 means, how to measure it, and how to fix a brand color that fails.", author: "Ioana Marin", date: "2026-07-18", tags: ["Accessibility", "Design"], minutes: 5 },
      { id: 5, title: "Shipping a static site in five minutes", excerpt: "GitHub Pages, Netlify Drop and the three path mistakes that cause a blank page.", author: "Vlad Petrescu", date: "2026-06-21", tags: ["Deploy"], minutes: 4 },
    ],
  };

  /** A placeholder SVG image as a data: URL. hue is 0 to 360; leave it out for a hue based on the text. */
  VWA.placeholderImage = ({ width = 800, height = 500, text = "", hue } = {}) => {
    const h = hue ?? [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
    const label = String(text).replace(/[<>&"]/g, "");
    const size = Math.round(Math.min(width, height) / 9);
    // One quiet hue with a soft shape, so it reads as "a picture goes here", not as decoration
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="hsl(${h} 30% 82%)"/>
      <circle cx="${width * 0.78}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.28}" fill="hsl(${h} 32% 74%)"/>
      <path d="M0 ${height} L${width * 0.35} ${height * 0.55} L${width * 0.6} ${height * 0.8} L${width} ${height * 0.5} L${width} ${height} Z" fill="hsl(${h} 28% 66%)"/>
      <text x="50%" y="50%" fill="hsl(${h} 35% 24%)" font-family="system-ui, sans-serif" font-size="${size}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  /** Gives every img[data-placeholder] without a src inside root its generated image.
      ui.js calls it again for content added later. */
  VWA.fillPlaceholders = (root = document) => {
    const images = root.matches?.("img[data-placeholder]") ? [root] : root.querySelectorAll("img[data-placeholder]");
    images.forEach((img) => {
      if (img.hasAttribute("src")) return;
      img.src = VWA.placeholderImage({
        width: Number(img.getAttribute("width")) || 800,
        height: Number(img.getAttribute("height")) || 500,
        text: img.dataset.placeholder,
        hue: img.dataset.hue ? Number(img.dataset.hue) : undefined,
      });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => VWA.fillPlaceholders());
  else VWA.fillPlaceholders();
})();
