const dbProvider = require('../db/dbProvider');

exports.getEntries = async (req, res) => {
  try {
    const entries = await dbProvider.DailyEntry.findAll();
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching entries');
  }
};

exports.getEntryById = async (req, res) => {
  try {
    const entry = await dbProvider.DailyEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ msg: 'Record not found' });
    }
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching record');
  }
};

exports.getEntryByDate = async (req, res) => {
  try {
    const dateStr = req.params.date; // YYYY-MM-DD
    const entries = await dbProvider.DailyEntry.find({ date: dateStr });
    if (entries && entries.length > 0) {
      return res.json(entries[0]);
    }
    res.json(null);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching record by date');
  }
};

exports.createEntry = async (req, res) => {
  const { date, items } = req.body;

  try {
    if (!date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Please provide a date and purchase items' });
    }

    // Check if an entry already exists for this date (just date portion)
    const normalizedDate = new Date(date).toISOString().split('T')[0];
    const existing = await dbProvider.DailyEntry.find({ date: normalizedDate });
    if (existing && existing.length > 0) {
      return res.status(400).json({
        msg: `A daily entry already exists for ${normalizedDate}. Please edit the existing entry instead.`,
        existingId: existing[0]._id
      });
    }

    // Process and calculate totals
    let grandTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId || quantity === undefined) continue;

      const qty = parseFloat(quantity);
      if (qty <= 0) continue; // skip zero/negative quantities

      // Fetch the product to get the official price
      const product = await dbProvider.Product.findById(productId);
      if (!product) {
        return res.status(404).json({ msg: `Product with ID ${productId} not found` });
      }

      const price = product.pricePerLiter;
      const total = parseFloat((qty * price).toFixed(2));
      grandTotal += total;

      processedItems.push({
        productId,
        productName: product.name,
        quantity: qty,
        price,
        total
      });
    }

    if (processedItems.length === 0) {
      return res.status(400).json({ msg: 'At least one product must have a quantity greater than zero' });
    }

    const newEntry = await dbProvider.DailyEntry.create({
      date: new Date(date),
      items: processedItems,
      grandTotal: parseFloat(grandTotal.toFixed(2))
    });

    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error saving daily entry');
  }
};

exports.updateEntry = async (req, res) => {
  const { date, items } = req.body;

  try {
    const entry = await dbProvider.DailyEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ msg: 'Daily entry not found' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Please provide items to update' });
    }

    // Process and calculate totals
    let grandTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId || quantity === undefined) continue;

      const qty = parseFloat(quantity);
      if (qty <= 0) continue; // skip zero/negative quantities

      const product = await dbProvider.Product.findById(productId);
      if (!product) {
        return res.status(404).json({ msg: `Product with ID ${productId} not found` });
      }

      const price = product.pricePerLiter;
      const total = parseFloat((qty * price).toFixed(2));
      grandTotal += total;

      processedItems.push({
        productId,
        productName: product.name,
        quantity: qty,
        price,
        total
      });
    }

    if (processedItems.length === 0) {
      return res.status(400).json({ msg: 'At least one product must have a quantity greater than zero' });
    }

    const fieldsToUpdate = {
      items: processedItems,
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };

    if (date) {
      fieldsToUpdate.date = new Date(date);
    }

    const updated = await dbProvider.DailyEntry.findByIdAndUpdate(req.params.id, fieldsToUpdate);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error updating daily entry');
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await dbProvider.DailyEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ msg: 'Daily entry not found' });
    }

    await dbProvider.DailyEntry.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Daily entry deleted successfully', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error deleting daily entry');
  }
};
