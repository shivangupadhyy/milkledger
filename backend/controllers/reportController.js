const dbProvider = require('../db/dbProvider');

// Helper to check if dates are on the same day (local time offset friendly)
const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

exports.getDashboardStats = async (req, res) => {
  try {
    const products = await dbProvider.Product.find({});
    const entries = await dbProvider.DailyEntry.findAll();

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let todayPurchaseAmount = 0;
    let todayMilkQuantity = 0;
    let thisMonthExpense = 0;

    // Filter today and this month
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      
      // Check if entry is today
      if (isSameDay(entryDate, today)) {
        todayPurchaseAmount += entry.grandTotal;
        entry.items.forEach(item => {
          todayMilkQuantity += item.quantity;
        });
      }

      // Check if entry is this month
      if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
        thisMonthExpense += entry.grandTotal;
      }
    });

    // Recent Entries: limit to 5
    const recentEntries = entries.slice(0, 5);

    // Chart 1: Daily Purchase (last 7 entries, in chronological order)
    const dailyChart = entries
      .slice(0, 7)
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: e.grandTotal,
        rawDate: e.date
      }))
      .reverse();

    // Chart 2: Monthly Expense (current year grouped by month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    
    // Initialize past 6 months including current
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      const year = d.getFullYear();
      const key = `${mName} ${year}`;
      monthlyDataMap[key] = { name: key, expense: 0, monthIndex: d.getMonth(), year };
    }

    entries.forEach(e => {
      const eDate = new Date(e.date);
      const mName = months[eDate.getMonth()];
      const key = `${mName} ${eDate.getFullYear()}`;
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].expense += e.grandTotal;
      }
    });

    const monthlyChart = Object.values(monthlyDataMap);

    // Chart 3: Product-wise Purchase Distribution (Pie chart of quantity or amount)
    const productDistribution = {};
    products.forEach(p => {
      productDistribution[p.name] = { name: p.name, value: 0, amount: 0 };
    });

    entries.forEach(e => {
      e.items.forEach(item => {
        if (!productDistribution[item.productName]) {
          productDistribution[item.productName] = { name: item.productName, value: 0, amount: 0 };
        }
        productDistribution[item.productName].value += item.quantity;
        productDistribution[item.productName].amount += item.total;
      });
    });

    const productChart = Object.values(productDistribution).filter(item => item.value > 0);

    res.json({
      summary: {
        todayPurchaseAmount: parseFloat(todayPurchaseAmount.toFixed(2)),
        todayMilkQuantity: parseFloat(todayMilkQuantity.toFixed(2)),
        thisMonthExpense: parseFloat(thisMonthExpense.toFixed(2)),
        totalProducts: products.length
      },
      charts: {
        dailyChart,
        monthlyChart,
        productChart
      },
      recentEntries
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error loading dashboard stats');
  }
};

exports.getReports = async (req, res) => {
  const { type, date, month, year, productId } = req.query;

  try {
    const entries = await dbProvider.DailyEntry.findAll();
    const products = await dbProvider.Product.find({});

    if (type === 'daily') {
      // Filter entries for selected date
      if (!date) return res.status(400).json({ msg: 'Date is required for daily report' });
      
      const targetDate = new Date(date);
      const filtered = entries.filter(e => isSameDay(new Date(e.date), targetDate));
      
      return res.json({
        reportType: 'daily',
        date,
        entries: filtered,
        summary: {
          totalLiters: filtered.reduce((sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0),
          totalExpense: filtered.reduce((sum, e) => sum + e.grandTotal, 0)
        }
      });
    }

    if (type === 'monthly') {
      // Filter entries for selected month and year
      if (!month || !year) return res.status(400).json({ msg: 'Month and Year are required' });
      
      const mIdx = parseInt(month); // 0-11
      const yVal = parseInt(year);
      
      const filtered = entries.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getMonth() === mIdx && eDate.getFullYear() === yVal;
      });

      // Product wise summary for this month
      const productSummary = {};
      products.forEach(p => {
        productSummary[p._id.toString()] = {
          productName: p.name,
          pricePerLiter: p.pricePerLiter,
          totalQuantity: 0,
          totalExpense: 0
        };
      });

      filtered.forEach(e => {
        e.items.forEach(item => {
          const pid = item.productId.toString();
          if (!productSummary[pid]) {
            productSummary[pid] = {
              productName: item.productName,
              pricePerLiter: item.price,
              totalQuantity: 0,
              totalExpense: 0
            };
          }
          productSummary[pid].totalQuantity += item.quantity;
          productSummary[pid].totalExpense += item.total;
        });
      });

      const productSummaryList = Object.values(productSummary).filter(p => p.totalQuantity > 0);

      return res.json({
        reportType: 'monthly',
        month: parseInt(month),
        year: parseInt(year),
        entries: filtered,
        productSummary: productSummaryList,
        summary: {
          totalLiters: filtered.reduce((sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0),
          totalExpense: filtered.reduce((sum, e) => sum + e.grandTotal, 0)
        }
      });
    }

    if (type === 'product') {
      // Filter total quantity purchased for each product (optional filter by month/year)
      const productTotals = {};
      products.forEach(p => {
        productTotals[p._id.toString()] = {
          productName: p.name,
          category: p.category,
          pricePerLiter: p.pricePerLiter,
          totalQuantity: 0,
          totalExpense: 0,
          status: p.status
        };
      });

      entries.forEach(e => {
        // Apply month/year filters if provided
        const eDate = new Date(e.date);
        if (month && eDate.getMonth() !== parseInt(month)) return;
        if (year && eDate.getFullYear() !== parseInt(year)) return;

        e.items.forEach(item => {
          const pid = item.productId.toString();
          if (!productTotals[pid]) {
            productTotals[pid] = {
              productName: item.productName,
              category: 'Milk',
              pricePerLiter: item.price,
              totalQuantity: 0,
              totalExpense: 0,
              status: 'Active'
            };
          }
          productTotals[pid].totalQuantity += item.quantity;
          productTotals[pid].totalExpense += item.total;
        });
      });

      const productSummaryList = Object.values(productTotals);

      return res.json({
        reportType: 'product',
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        productSummary: productSummaryList,
        summary: {
          totalLiters: productSummaryList.reduce((sum, p) => sum + p.totalQuantity, 0),
          totalExpense: productSummaryList.reduce((sum, p) => sum + p.totalExpense, 0)
        }
      });
    }

    res.status(400).json({ msg: 'Invalid report type' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error generating reports');
  }
};
