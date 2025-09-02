const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: "Admin" },  
    slug: { type: String, required: true, unique: true, index: true }, // optional UI-friendly string; created from title if not provided
    date: { type: String, required: true }, 
    imageUrl: { type: String },
    categories: { type: [String], default: [] },
    tags: { type: [String], default: [] },
  }, 
  { timestamps: true } 
);

// Pre-validate to create a unique slug if not provided
blogSchema.pre("validate", async function (next) {
  if (this.slug) return next();

  // base slug
  let base = slugify(this.title || "post", { lower: true, strict: true }).slice(0, 120);
  if (!base) base = "post";

  let candidate = base;
  let suffix = 0;

  const Model = mongoose.model(this.constructor.modelName);
  while (await Model.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
    if (suffix > 1000) { // safety fallback
      candidate = `${base}-${Date.now().toString().slice(-6)}`;
      break;
    }
  }

  this.slug = candidate;
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
