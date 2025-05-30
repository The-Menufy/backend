/**
 * @swagger
 * tags:
 *   - name: Recipe
 *     description: Gestion des recettes (images, vidéo, ingrédients, ustensiles, variantes)
 *
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nom:
 *           type: string
 *         temps_preparation:
 *           type: string
 *         temps_cuisson:
 *           type: string
 *         ingredientsGroup:
 *           type: array
 *           items:
 *             type: object
 *         utensils:
 *           type: array
 *           items:
 *             type: string
 *         decoration:
 *           type: array
 *           items:
 *             type: string
 *         steps:
 *           type: array
 *           items:
 *             type: string
 *         productFK:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         video:
 *           type: string
 *         variants:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/recipe:
 *   post:
 *     summary: Ajouter une recette (avec upload d'images/vidéo)
 *     tags: [Recipe]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               temps_preparation:
 *                 type: string
 *                 example: "30 min"
 *               temps_cuisson:
 *                 type: string
 *                 example: "45 min"
 *               ingredientsGroup:
 *                 type: string
 *                 description: JSON.stringify d'un tableau d'ingrédients groupés
 *               utensils:
 *                 type: string
 *                 description: JSON.stringify d'un tableau d'IDs d'ustensiles
 *               decoration:
 *                 type: string
 *                 description: JSON.stringify d'un tableau de décorations
 *               steps:
 *                 type: string
 *                 description: JSON.stringify d'un tableau d'étapes
 *               productFK:
 *                 type: string
 *                 description: ID du produit lié
 *               variants:
 *                 type: string
 *                 description: JSON.stringify d'un tableau d'IDs de variantes
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Recette créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Erreur de validation ou d'upload
 *   get:
 *     summary: Obtenir toutes les recettes
 *     tags: [Recipe]
 *     responses:
 *       200:
 *         description: Liste des recettes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/recipe/{id}:
 *   get:
 *     summary: Obtenir une recette par son ID
 *     tags: [Recipe]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la recette
 *     responses:
 *       200:
 *         description: Recette trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recette non trouvée
 *   put:
 *     summary: Modifier une recette (avec upload d'images/vidéo)
 *     tags: [Recipe]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la recette
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               temps_preparation:
 *                 type: string
 *               temps_cuisson:
 *                 type: string
 *               ingredientsGroup:
 *                 type: string
 *               utensils:
 *                 type: string
 *               decoration:
 *                 type: string
 *               steps:
 *                 type: string
 *               productFK:
 *                 type: string
 *               variants:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Recette modifiée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recette non trouvée
 *       400:
 *         description: Erreur de validation ou d'upload
 *   delete:
 *     summary: Supprimer une recette
 *     tags: [Recipe]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la recette
 *     responses:
 *       200:
 *         description: Recette supprimée
 *       404:
 *         description: Recette non trouvée
 *       500:
 *         description: Erreur serveur
 */
const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Ustensile = require("../../models/Ustensile");
const DishOfTheDay = require("../../models/DishOfTheDay");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Temporary storage for multer (files will be deleted after Cloudinary upload)
const tempDir = path.join(__dirname, "../../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "images") {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      }
      cb(new Error("Images only (jpeg, jpg, png)!"));
    } else if (file.fieldname === "video") {
      const filetypes = /mp4|webm/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      }
      cb(new Error("Videos only (mp4, webm)!"));
    } else {
      cb(new Error("Invalid field name"));
    }
  },
  limits: {
    fileSize: 10000000, // 10MB limit
  },
}).fields([{ name: "images", maxCount: 5 }, { name: "video", maxCount: 1 }]);

// Middleware to handle multer errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Helper function to parse quantity from customQuantity (e.g., "150g" -> 150)
const parseQuantity = (customQuantity) => {
  if (!customQuantity || typeof customQuantity !== "string") return 0;
  const match = customQuantity.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

// POST a new recipe
router.post("/", uploadMiddleware, async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    const {
      nom,
      temps_preparation,
      temps_cuisson,
      ingredientsGroup,
      utensils,
      decoration,
      steps,
      productFK,
      variants,
    } = req.body;

    if (!nom || !temps_preparation || !temps_cuisson || !productFK) {
      return res
        .status(400)
        .json({ message: "nom, temps_preparation, temps_cuisson, and productFK are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(productFK)) {
      return res.status(400).json({ message: "Invalid productFK" });
    }

    const product = await Product.findById(productFK).populate("categoryFK");
    if (!product || !product.categoryFK) {
      return res.status(400).json({ message: "Product or category not found" });
    }

    const parsedIngredientsGroup =
      typeof ingredientsGroup === "string"
        ? JSON.parse(ingredientsGroup)
        : ingredientsGroup;
    if (!Array.isArray(parsedIngredientsGroup)) {
      return res.status(400).json({ message: "ingredientsGroup must be an array" });
    }

    const parsedUtensils =
      typeof utensils === "string" ? JSON.parse(utensils) : utensils;
    const parsedDecoration =
      typeof decoration === "string" ? JSON.parse(decoration) : decoration;
    const parsedSteps = typeof steps === "string" ? JSON.parse(steps) : steps;
    const parsedVariants =
      typeof variants === "string" ? JSON.parse(variants) : variants;

    if (parsedUtensils && Array.isArray(parsedUtensils)) {
      for (const utensilId of parsedUtensils) {
        if (!mongoose.Types.ObjectId.isValid(utensilId)) {
          return res
            .status(400)
            .json({ message: `Invalid utensil ID: ${utensilId}` });
        }
        const utensil = await Ustensile.findById(utensilId);
        if (!utensil) {
          return res
            .status(400)
            .json({ message: `Ustensile not found: ${utensilId}` });
        }
      }
    }

    if (parsedVariants && Array.isArray(parsedVariants)) {
      for (const variantId of parsedVariants) {
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
          return res
            .status(400)
            .json({ message: `Invalid variant ID: ${variantId}` });
        }
        const variantExists = await mongoose
          .model("RecipeVariant")
          .findById(variantId);
        if (!variantExists) {
          return res
            .status(400)
            .json({ message: `Variant not found: ${variantId}` });
        }
      }
    }

    let imageUrls = [];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "recipes/images" })
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((result) => result.secure_url);
      req.files.images.forEach((file) => fs.unlinkSync(file.path));
    }

    let videoUrl = "";
    if (req.files && req.files.video) {
      const result = await cloudinary.uploader.upload(req.files.video[0].path, {
        folder: "recipes/videos",
        resource_type: "video",
      });
      videoUrl = result.secure_url;
      fs.unlinkSync(req.files.video[0].path);
    }

    let shouldBeDishOfTheDay = false;
    for (const group of parsedIngredientsGroup) {
      for (const item of group.items) {
        const quantity = parseQuantity(item.customQuantity);
        const ingredient = await mongoose
          .model("Ingredient")
          .findById(item.ingredient);
        if (ingredient && ingredient.qtMax) {
          const adjustedQtMax = ingredient.qtMax / 50;
          if (adjustedQtMax > quantity) {
            shouldBeDishOfTheDay = true;
            break;
          }
        }
      }
      if (shouldBeDishOfTheDay) break;
    }

    const newRecipe = new Recipe({
      nom,
      temps_preparation,
      temps_cuisson,
      ingredientsGroup: parsedIngredientsGroup || [],
      utensils: parsedUtensils || [],
      decoration: parsedDecoration || [],
      steps: parsedSteps || [],
      productFK,
      images: imageUrls,
      video: videoUrl,
      variants: parsedVariants || [],
    });

    const savedRecipe = await newRecipe.save();
    await Product.findByIdAndUpdate(productFK, { recipeFK: savedRecipe._id });

    if (shouldBeDishOfTheDay) {
      const existingDish = await DishOfTheDay.findOne({ productFK });
      if (!existingDish) {
        const newDish = new DishOfTheDay({
          date: new Date(),
          statut: "Active",
          productFK,
        });
        await newDish.save();
      }
    }

    const populatedRecipe = await Recipe.findById(savedRecipe._id)
      .populate("productFK", "name price")
      .populate("ingredientsGroup.items.ingredient", "libelle photo")
      .populate("utensils", "libelle quantity disponibility photo")
      .populate("variants", "name portions images");

    res.status(201).json(populatedRecipe);
  } catch (error) {
    if (req.files) {
      if (req.files.images) req.files.images.forEach((file) => fs.unlinkSync(file.path));
      if (req.files.video) req.files.video.forEach((file) => fs.unlinkSync(file.path));
    }
    console.error("Error in recipe creation:", error);
    res
      .status(400)
      .json({ message: "Error creating recipe", error: error.message });
  }
});

// PUT /api/recipe/:id
router.put("/:id", uploadMiddleware, async (req, res) => {
  try {
    const {
      nom,
      temps_preparation,
      temps_cuisson,
      ingredientsGroup,
      utensils,
      decoration,
      steps,
      productFK,
      variants,
    } = req.body;

    const existingRecipe = await Recipe.findById(req.params.id);
    if (!existingRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const finalProductFK = productFK || existingRecipe.productFK;

    if (finalProductFK && !mongoose.Types.ObjectId.isValid(finalProductFK)) {
      return res.status(400).json({ message: "Invalid productFK" });
    }

    if (finalProductFK) {
      const product = await Product.findById(finalProductFK).populate("categoryFK");
      if (!product || !product.categoryFK) {
        return res.status(400).json({ message: "Product or category not found" });
      }
    }

    const parsedIngredientsGroup = ingredientsGroup
      ? JSON.parse(ingredientsGroup)
      : existingRecipe.ingredientsGroup;
    if (ingredientsGroup && !Array.isArray(parsedIngredientsGroup)) {
      return res.status(400).json({ message: "ingredientsGroup must be an array" });
    }

    const parsedUtensils = utensils
      ? JSON.parse(utensils)
      : existingRecipe.utensils;
    const parsedDecoration = decoration
      ? JSON.parse(decoration)
      : existingRecipe.decoration;
    const parsedSteps = steps ? JSON.parse(steps) : existingRecipe.steps;
    const parsedVariants = variants
      ? JSON.parse(variants)
      : existingRecipe.variants;

    if (parsedUtensils && Array.isArray(parsedUtensils)) {
      for (const utensilId of parsedUtensils) {
        if (!mongoose.Types.ObjectId.isValid(utensilId)) {
          return res
            .status(400)
            .json({ message: `Invalid utensil ID: ${utensilId}` });
        }
        const utensil = await Ustensile.findById(utensilId);
        if (!utensil) {
          return res
            .status(400)
            .json({ message: `Ustensile not found: ${utensilId}` });
        }
      }
    }

    if (parsedVariants && Array.isArray(parsedVariants)) {
      for (const variantId of parsedVariants) {
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
          return res
            .status(400)
            .json({ message: `Invalid variant ID: ${variantId}` });
        }
        const variantExists = await mongoose
          .model("RecipeVariant")
          .findById(variantId);
        if (!variantExists) {
          return res
            .status(400)
            .json({ message: `Variant not found: ${variantId}` });
        }
      }
    }

    let imageUrls = [...existingRecipe.images];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "recipes/images" })
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((result) => result.secure_url);
      req.files.images.forEach((file) => fs.unlinkSync(file.path));
      // Delete old images from Cloudinary
      if (existingRecipe.images.length > 0) {
        const publicIds = existingRecipe.images.map((url) =>
          url.split("/").slice(-2).join("/").split(".")[0]
        );
        await cloudinary.api.delete_resources(publicIds, { resource_type: "image" });
      }
    }

    let videoUrl = existingRecipe.video;
    if (req.files && req.files.video) {
      const result = await cloudinary.uploader.upload(req.files.video[0].path, {
        folder: "recipes/videos",
        resource_type: "video",
      });
      videoUrl = result.secure_url;
      fs.unlinkSync(req.files.video[0].path);
      // Delete old video from Cloudinary
      if (existingRecipe.video) {
        const publicId = existingRecipe.video
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }
    }

    const updateData = {
      nom: nom || existingRecipe.nom,
      temps_preparation: temps_preparation || existingRecipe.temps_preparation,
      temps_cuisson: temps_cuisson || existingRecipe.temps_cuisson,
      ingredientsGroup: parsedIngredientsGroup,
      utensils: parsedUtensils,
      decoration: parsedDecoration,
      steps: parsedSteps,
      productFK: finalProductFK,
      images: imageUrls,
      video: videoUrl,
      variants: parsedVariants,
    };

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const populatedRecipe = await Recipe.findById(updatedRecipe._id)
      .populate("productFK", "name price")
      .populate("ingredientsGroup.items.ingredient", "libelle photo")
      .populate("utensils", "libelle quantity disponibility photo")
      .populate("variants", "name portions images");

    res.status(200).json(populatedRecipe);
  } catch (error) {
    if (req.files) {
      if (req.files.images) req.files.images.forEach((file) => fs.unlinkSync(file.path));
      if (req.files.video) req.files.video.forEach((file) => fs.unlinkSync(file.path));
    }
    console.error("Error updating recipe:", error);
    res
      .status(400)
      .json({ message: "Error updating recipe", error: error.message });
  }
});

// GET all recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("productFK", "name price")
      .populate("ingredientsGroup.items.ingredient", "libelle photo")
      .populate("utensils", "libelle quantity disponibility photo")
      .populate("variants", "name portions images");
    res.status(200).json(recipes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching recipes", error: error.message });
  }
});

// GET single recipe
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }
    const recipe = await Recipe.findById(req.params.id)
      .populate("productFK", "name price")
      .populate("ingredientsGroup.items.ingredient", "libelle photo")
      .populate("utensils", "libelle quantity disponibility photo")
      .populate("variants", "name portions images");
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    console.log("Fetched recipe for client:", recipe);
    res.status(200).json(recipe);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching recipe", error: error.message });
  }
});

// DELETE a recipe
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    await Product.findByIdAndUpdate(deletedRecipe.productFK, {
      recipeFK: null,
    });

    // Delete images and video from Cloudinary
    if (deletedRecipe.images.length > 0) {
      const publicIds = deletedRecipe.images.map((url) =>
        url.split("/").slice(-2).join("/").split(".")[0]
      );
      await cloudinary.api.delete_resources(publicIds, { resource_type: "image" });
    }
    if (deletedRecipe.video) {
      const publicId = deletedRecipe.video
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    }

    // Remove from DishOfTheDay if it exists
    await DishOfTheDay.deleteMany({ productFK: deletedRecipe.productFK });

    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting recipe", error: error.message });
  }
});

module.exports = router;