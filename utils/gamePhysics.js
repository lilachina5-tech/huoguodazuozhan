// Simple Physics Engine for "Falling Sand" style interactions
const GRAVITY = 0.3;
const FRICTION = 0.95;
const BOUNCE = 0.4;
const TERMINAL_VELOCITY = 8;

class Ingredient {
  constructor(x, y, type, id) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2; // Slight random initial h-velocity
    this.vy = 0;
    this.radius = 12; // Pixel radius
    this.type = type; // 'meatball', 'vegetable', 'frozen_meat', 'meat'
    this.state = type === 'frozen_meat' ? 'frozen' : 'normal'; // frozen, normal, cooked
    this.inPot = false;
    this.active = true;
  }

  update(dirtCtx, width, height, obstacles, waterZones) {
    if (!this.active || this.inPot) return;

    // Apply Gravity
    this.vy += GRAVITY;
    if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

    // Proposed next position
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;

    // 1. Terrain Collision (Pixel perfect-ish check against dirt canvas)
    // We check a few points around the circle bottom/sides
    const isCollidingWithDirt = (testx, testy) => {
      // Boundary check
      if (testx < 0 || testx > width || testy < 0 || testy > height) return true;
      
      try {
        const pixel = dirtCtx.getImageData(Math.floor(testx), Math.floor(testy), 1, 1).data;
        return pixel[3] > 0; // Alpha > 0 means dirt exists
      } catch(e) {
        return false;
      }
    };

    // Check collision at bottom
    if (isCollidingWithDirt(nextX, nextY + this.radius)) {
      this.vy *= -0.2; // Small bounce
      this.vx *= 0.8; // Friction
      // Push up out of dirt
      nextY = this.y; 
      
      // Roll sideways if stuck
      if (Math.abs(this.vx) < 0.1) {
         // Check left/right to see if we can roll
         if (!isCollidingWithDirt(this.x - 5, this.y + this.radius + 2)) this.vx -= 0.5;
         else if (!isCollidingWithDirt(this.x + 5, this.y + this.radius + 2)) this.vx += 0.5;
      }
    } else {
        // Air friction
        this.vx *= 0.99;
    }

    // Side collisions
    if (isCollidingWithDirt(nextX + this.radius, this.y) || isCollidingWithDirt(nextX - this.radius, this.y)) {
      this.vx *= -0.5;
      nextX = this.x;
    }

    // 2. Obstacle Collision (Circles)
    obstacles.forEach(obs => {
      const dx = nextX - obs.x;
      const dy = nextY - obs.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < this.radius + obs.radius) {
        // Simple circle bounce response
        const angle = Math.atan2(dy, dx);
        const force = 5; // Bounce force
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
        nextX = this.x + this.vx;
        nextY = this.y + this.vy;
      }
    });

    // 3. Water Zone Interaction (Defrost)
    if (this.state === 'frozen') {
        waterZones.forEach(zone => {
            // Simple rect check for zone
            if (nextX > zone.x && nextX < zone.x + zone.w && nextY > zone.y && nextY < zone.y + zone.h) {
                this.state = 'normal'; // Thawed!
                this.type = 'meat'; // Change type visual
                this.vy *= 0.5; // Water resistance
                this.vx *= 0.5;
            }
        });
    }

    // Update position
    this.x = nextX;
    this.y = nextY;

    // Boundaries
    if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.5; }
    if (this.x > width - this.radius) { this.x = width - this.radius; this.vx *= -0.5; }
    
    // Bottom of screen (The Pot)
    if (this.y > height - 50) {
        // Check if in pot area (assume full bottom for now or middle range)
        if (this.y > height - 20) {
             // Logic: If frozen meat hits pot while still frozen, it doesn't count as success (or maybe it melts instantly but badly? For now let's just let it in but track state)
             // We set inPot to true, but the GameLevel will decide if it counts based on state.
             this.inPot = true;
        }
    }
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Check for image asset
    const img = window.GameAssets ? window.GameAssets.get(this.type) : null;

    if (img) {
        // Draw Image with some rotation if we had rotation logic, but for now simple draw
        // Keep size consistent with radius. Radius 12 means diameter 24.
        const size = this.radius * 2.2; // Slightly larger than hitbox
        ctx.drawImage(img, -size/2, -size/2, size, size);
    } else {
        // Fallback drawing
        if (this.type === 'meatball') {
            ctx.fillStyle = '#d97706'; 
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'vegetable') {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'frozen_meat') {
            ctx.fillStyle = '#93c5fd';
            ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
        } else if (this.type === 'meat') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
        } else if (this.type === 'mushroom') {
            ctx.fillStyle = '#d6d3d1';
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.restore();
  }
}

// Make globally available
window.Ingredient = Ingredient;