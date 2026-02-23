# Complete Guide to Customizing ERPNext Login/Landing Page Background

## 📚 Table of Contents
1. [Quick Methods (No Code)](#quick-methods-no-code)
2. [CSS Override Methods](#css-override-methods)
3. [Custom App Method](#custom-app-method)
4. [Advanced Customizations](#advanced-customizations)
5. [Troubleshooting](#troubleshooting)

---

## 1. Quick Methods (No Code)

### Method 1A: Using Website Settings (Splash Image)

**Best For:** Simple background image on website pages (not login page directly)

**Steps:**
1. Go to: **Setup → Website → Website Settings**
2. Scroll to **Banner** section
3. Upload image in **Splash Image** field
4. Save

**Note:** This affects website pages, not the login page background.

---

### Method 1B: Using Custom CSS in Website Settings

**Best For:** Quick customization without creating files

**Steps:**

1. Go to: **Setup → Website → Website Settings**
2. Scroll to **Customization** section
3. Add custom CSS in **Custom CSS** field:

```css
/* Simple solid color background */
body {
    background-color: #1a1a2e !important;
}

/* Or gradient background */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    background-attachment: fixed !important;
}

/* Or image background */
body {
    background: url('/files/your-background-image.jpg') no-repeat center center fixed !important;
    background-size: cover !important;
}

/* Style the login card */
.for-login .page-card {
    background-color: rgba(255, 255, 255, 0.95) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
}
```

4. Click **Save**

---

## 2. CSS Override Methods

### Method 2A: Custom CSS File in Your Site

**Best For:** Production environments, version-controlled customizations

**Steps:**

1. **Create custom CSS file:**

```bash
# Navigate to your site's public folder
cd sites/[your-site]/public

# Create a custom CSS file
nano custom_login.css
```

2. **Add your CSS customizations:**

```css
/* custom_login.css */

/* Background for login page */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    background-attachment: fixed !important;
}

/* Alternative: Image background */
body {
    background: url('/files/login-background.jpg') no-repeat center center fixed !important;
    background-size: cover !important;
}

/* Add overlay for better readability */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: -1;
}

/* Style the login card */
.for-login .page-card,
.for-signup .page-card,
.for-forgot .page-card {
    background-color: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* Style the login header */
.page-card-head {
    color: #333 !important;
}

/* Adjust form elements */
.page-card-body input[type="text"],
.page-card-body input[type="email"],
.page-card-body input[type="password"] {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

/* Button styling */
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: none !important;
}
```

3. **Link the CSS file in Website Settings:**

Go to: **Setup → Website → Website Settings**

In **Custom CSS** field, add:
```css
@import url('/assets/[your-site]/custom_login.css');
```

Or use the **HTML Head** field to add:
```html
<link rel="stylesheet" href="/assets/[your-site]/custom_login.css">
```

---

### Method 2B: Override via Custom App

**Best For:** Multi-site deployments, reusable customizations

**Steps:**

1. **Create a custom app (if you don't have one):**

```bash
cd ~/frappe-bench
bench new-app custom_branding
# Follow the prompts
bench --site [your-site] install-app custom_branding
```

2. **Create custom SCSS file:**

```bash
cd apps/custom_branding
mkdir -p custom_branding/public/scss
nano custom_branding/public/scss/custom_login.scss
```

3. **Add your styles:**

```scss
// custom_login.scss

// Import Frappe variables for consistency
@import "../../../../frappe/frappe/public/scss/desk/variables";

// Custom login background
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-attachment: fixed;
    
    @include media-breakpoint-up(sm) {
        background-color: transparent;
    }
}

// Alternative patterns
/*
// Pattern 1: Image background
body {
    background: url('/assets/custom_branding/images/login-bg.jpg') no-repeat center center fixed;
    background-size: cover;
}

// Pattern 2: Animated gradient
body {
    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

// Pattern 3: Geometric pattern overlay
body::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
        repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px);
    z-index: -1;
}
*/

// Enhanced login card
.for-login,
.for-signup,
.for-forgot,
.for-email-login,
.for-login-with-email-link {
    .page-card {
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        
        // Glass morphism effect
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
            border-radius: var(--border-radius-md);
            pointer-events: none;
        }
    }
}

// Logo area
.page-card-head {
    img {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    h4 {
        color: #333;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }
}

// Form elements
.page-card-body {
    input[type="text"],
    input[type="email"],
    input[type="password"] {
        background-color: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        transition: all 0.3s ease;
        
        &:focus {
            background-color: #fff !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
    }
}

// Primary button
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
}
```

4. **Register the SCSS file in hooks.py:**

```python
# apps/custom_branding/custom_branding/hooks.py

app_include_css = [
    "/assets/custom_branding/css/custom_login.css"
]

# Or for specific pages
web_include_css = [
    "/assets/custom_branding/css/custom_login.css"
]
```

5. **Build assets:**

```bash
bench build --app custom_branding
bench clear-cache
```

---

## 3. Advanced Customizations

### Option 3A: Different Backgrounds for Different Sites

**For multi-tenant setups:**

```javascript
// In Website Settings → Custom HTML Head

<script>
document.addEventListener('DOMContentLoaded', function() {
    var hostname = window.location.hostname;
    var body = document.body;
    
    // Different backgrounds per site
    if (hostname === 'site1.example.com') {
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (hostname === 'site2.example.com') {
        body.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
        body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
    
    body.style.backgroundAttachment = 'fixed';
});
</script>
```

---

### Option 3B: Time-Based Background Changes

**Background changes based on time of day:**

```css
/* In Website Settings → Custom CSS */
@import url('/assets/custom_branding/css/dynamic_background.css');
```

```javascript
// In Website Settings → Custom HTML Head

<script>
document.addEventListener('DOMContentLoaded', function() {
    var hour = new Date().getHours();
    var body = document.body;
    
    if (hour >= 6 && hour < 12) {
        // Morning: Light blue gradient
        body.style.background = 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)';
    } else if (hour >= 12 && hour < 18) {
        // Afternoon: Warm gradient
        body.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    } else if (hour >= 18 && hour < 21) {
        // Evening: Purple gradient
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else {
        // Night: Dark gradient
        body.style.background = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
    }
    
    body.style.backgroundAttachment = 'fixed';
});
</script>
```

---

### Option 3C: Video Background

**Add a video background to login page:**

```javascript
// In Website Settings → Custom HTML Head

<script>
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.for-login')) {
        // Create video element
        var video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
            transform: translateX(-50%) translateY(-50%);
            z-index: -1;
            object-fit: cover;
        `;
        
        var source = document.createElement('source');
        source.src = '/files/login-background-video.mp4';
        source.type = 'video/mp4';
        
        video.appendChild(source);
        document.body.insertBefore(video, document.body.firstChild);
        
        // Add overlay for readability
        var overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: -1;
        `;
        document.body.insertBefore(overlay, document.body.firstChild);
    }
});
</script>
```

---

### Option 3D: Particle.js Background

**Add animated particles:**

```html
<!-- In Website Settings → Custom HTML Head -->

<script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.for-login')) {
        // Create particles container
        var particlesDiv = document.createElement('div');
        particlesDiv.id = 'particles-js';
        particlesDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        `;
        document.body.insertBefore(particlesDiv, document.body.firstChild);
        
        // Initialize particles
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#ffffff' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffffff',
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'repulse' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
});
</script>
```

---

## 4. Pre-Made Background Styles

### Style 1: Corporate Blue

```css
body {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    background-attachment: fixed;
}

.for-login .page-card {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

### Style 2: Modern Purple

```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-attachment: fixed;
}
```

### Style 3: Sunset Orange

```css
body {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    background-attachment: fixed;
}
```

### Style 4: Ocean Teal

```css
body {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    background-attachment: fixed;
}
```

### Style 5: Forest Green

```css
body {
    background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
    background-attachment: fixed;
}
```

### Style 6: Dark Mode

```css
body {
    background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
    background-attachment: fixed;
}

.for-login .page-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.page-card-head h4,
.page-card-body .form-label {
    color: #ffffff !important;
}

.page-card-body input {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
```

### Style 7: Image with Blur Overlay

```css
body {
    background: url('/files/office-background.jpg') no-repeat center center fixed;
    background-size: cover;
}

body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    z-index: -1;
}

.for-login .page-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
}
```

---

## 5. Troubleshooting

### Issue 1: Background Not Showing

**Cause:** CSS not loading or being overridden

**Solutions:**

1. **Clear browser cache:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)

2. **Clear Frappe cache:**
```bash
bench clear-cache
bench clear-website-cache
```

3. **Rebuild assets:**
```bash
bench build
```

4. **Check CSS specificity:** Add `!important` to your styles
```css
body {
    background: #1a1a2e !important;
}
```

5. **Verify file paths:**
```bash
# Check if your CSS file exists
ls -la sites/[your-site]/public/custom_login.css

# Check if image exists
ls -la sites/[your-site]/public/files/login-background.jpg
```

---

### Issue 2: Background Shows on Website but Not Login Page

**Cause:** Login page uses different templates

**Solution:** Target login-specific selectors:

```css
/* Target all login-related pages */
.for-login body,
.for-signup body,
.for-forgot body {
    background: your-background !important;
}

/* Or use more specific selectors */
body:has(.for-login),
body:has(.for-signup) {
    background: your-background !important;
}
```

---

### Issue 3: Background Image Not Loading

**Cause:** Incorrect file path or permissions

**Solutions:**

1. **Upload image via File Manager:**
   - Go to: **Tools → File Manager → New**
   - Upload your image
   - Copy the file URL (e.g., `/files/background.jpg`)

2. **Use absolute URL:**
```css
background: url('https://your-domain.com/files/background.jpg');
```

3. **Check file permissions:**
```bash
chmod 644 sites/[your-site]/public/files/background.jpg
```

4. **Verify NGINX is serving static files:**
```bash
# Test direct access
curl -I https://your-site.com/files/background.jpg
```

---

### Issue 4: Styles Work Locally but Not in Production

**Cause:** Assets not built or deployed

**Solutions:**

1. **Build production assets:**
```bash
bench build --production
```

2. **Restart bench:**
```bash
bench restart
```

3. **Check if using CDN:** Clear CDN cache if applicable

4. **Verify assets are in correct location:**
```bash
ls -la sites/assets/css/
ls -la sites/assets/[app-name]/css/
```

---

### Issue 5: Background Affects Entire Site, Not Just Login

**Cause:** CSS applying globally

**Solution:** Scope your styles to login pages only:

```css
/* Only apply to login page */
.for-login,
.for-signup,
.for-forgot {
    body {
        background: your-background !important;
    }
}

/* Alternative using JavaScript in HTML Head */
<script>
if (window.location.pathname === '/login') {
    document.body.style.background = 'your-background';
}
</script>
```

---

## 6. Best Practices

### Performance Optimization

1. **Optimize images:**
```bash
# Compress background images
convert background.jpg -quality 80 -resize 1920x1080 background-optimized.jpg
```

2. **Use WebP format:**
```css
body {
    background: url('/files/background.webp') no-repeat center center fixed;
    background-size: cover;
}

/* Fallback for older browsers */
@supports not (background-image: url('image.webp')) {
    body {
        background: url('/files/background.jpg') no-repeat center center fixed;
    }
}
```

3. **Lazy load heavy backgrounds:**
```javascript
<script>
document.addEventListener('DOMContentLoaded', function() {
    var img = new Image();
    img.onload = function() {
        document.body.style.background = 'url(/files/background.jpg) no-repeat center center fixed';
        document.body.style.backgroundSize = 'cover';
    };
    img.src = '/files/background.jpg';
});
</script>
```

---

### Accessibility Considerations

1. **Ensure sufficient contrast:**
```css
/* Make sure login card is readable */
.for-login .page-card {
    background-color: rgba(255, 255, 255, 0.95);
}

/* Dark text on light background */
.page-card-body {
    color: #333;
}
```

2. **Provide fallback for reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
    body {
        animation: none !important;
    }
}
```

3. **Test with screen readers**

---

### Mobile Responsiveness

```css
/* Simpler background on mobile */
@media (max-width: 768px) {
    body {
        background: #667eea !important; /* Solid color instead of gradient/image */
    }
    
    .for-login .page-card {
        margin: 10px;
        padding: 20px 10px;
    }
}

/* Full experience on desktop */
@media (min-width: 769px) {
    body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
}
```

---

## 7. Complete Working Example

Here's a complete, copy-paste ready solution:

### In Website Settings → Custom CSS:

```css
/* Modern Login Background - Complete Solution */

/* Background gradient */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    background-attachment: fixed !important;
    min-height: 100vh;
}

/* Enhanced login card */
.for-login .page-card,
.for-signup .page-card,
.for-forgot .page-card,
.for-email-login .page-card,
.for-login-with-email-link .page-card {
    background-color: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* Logo styling */
.page-card-head img {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.page-card-head h4 {
    color: #333 !important;
}

/* Form inputs */
.page-card-body input[type="text"],
.page-card-body input[type="email"],
.page-card-body input[type="password"] {
    background-color: rgba(255, 255, 255, 0.9) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s ease;
}

.page-card-body input:focus {
    background-color: #fff !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

/* Login button */
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: none !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4) !important;
}

/* Mobile optimization */
@media (max-width: 768px) {
    body {
        background: #667eea !important;
    }
    
    .for-login .page-card {
        margin: 10px;
        padding: 30px 10px;
    }
}
```

**That's it!** Save and refresh your login page to see the changes.

---

## Summary

**Recommended Approach:**
1. **For quick testing:** Use Website Settings → Custom CSS (Method 1B)
2. **For production:** Create custom app with SCSS files (Method 2B)
3. **For simple changes:** Use Website Settings Custom CSS (Method 1B)

**Key Files to Know:**
- Login template: `apps/frappe/frappe/www/login.html`
- Login styles: `apps/frappe/frappe/public/scss/login.bundle.scss`
- Website Settings: Go to Setup → Website → Website Settings

**Quick Tips:**
- Always use `!important` if styles aren't applying
- Clear cache after changes: `bench clear-cache`
- Test on mobile devices
- Optimize images for web
- Ensure login card remains readable

---

**Need Help?**
- Check browser console for CSS errors (F12)
- Verify file paths are correct
- Test with different browsers
- Clear all caches (browser + Frappe)

---

**End of Guide**
