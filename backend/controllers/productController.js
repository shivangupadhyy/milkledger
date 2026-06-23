const dbProvider = require('../db/dbProvider');

exports.getProducts = async (req, res) => {
  const { name, status } = req.query;

  try {
    const query = {};
    if (name) query.name = name;
    if (status) query.status = status;

    const products = await dbProvider.Product.find(query);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching products');
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await dbProvider.Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching product');
  }
};

exports.createProduct = async (req, res) => {
  const { name, pricePerLiter, category, status, unit } = req.body;

  try {
    if (!name || pricePerLiter === undefined || !category) {
      return res.status(400).json({ msg: 'Please enter Name, Price, and Category' });
    }

    const price = parseFloat(pricePerLiter);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ msg: 'Price must be a positive number' });
    }

    // Check if name already exists (case-insensitive)
    const existing = await dbProvider.Product.find({ name });
    const duplicate = existing.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      return res.status(400).json({ msg: 'A product with this name already exists' });
    }

    const product = await dbProvider.Product.create({
      name,
      pricePerLiter: price,
      category,
      unit: unit || 'Liter',
      status: status || 'Active'
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error creating product');
  }
};

exports.updateProduct = async (req, res) => {
  const { name, pricePerLiter, category, status, unit } = req.body;

  try {
    const product = await dbProvider.Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const fieldsToUpdate = {};
    if (name !== undefined) {
      // Check duplicate name
      const existing = await dbProvider.Product.find({ name });
      const duplicate = existing.find(p => p.name.toLowerCase() === name.toLowerCase() && p._id.toString() !== req.params.id);
      if (duplicate) {
        return res.status(400).json({ msg: 'Another product with this name already exists' });
      }
      fieldsToUpdate.name = name;
    }
    if (pricePerLiter !== undefined) {
      const price = parseFloat(pricePerLiter);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ msg: 'Price must be a positive number' });
      }
      fieldsToUpdate.pricePerLiter = price;
    }
    if (category !== undefined) fieldsToUpdate.category = category;
    if (status !== undefined) fieldsToUpdate.status = status;
    if (unit !== undefined) fieldsToUpdate.unit = unit;

    const updated = await dbProvider.Product.findByIdAndUpdate(req.params.id, fieldsToUpdate);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error updating product');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await dbProvider.Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    await dbProvider.Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Product deleted successfully', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error deleting product');
  }
};
