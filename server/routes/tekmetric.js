const express = require('express');
const router = express.Router();
const tekmetricService = require('../services/tekmetricService');

// ===== Shop Routes =====
router.get('/shops', async (req, res, next) => {
  try {
    const data = await tekmetricService.getShops();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/shops/:shopId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getShop(req.params.shopId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Customer Routes =====
router.get('/customers', async (req, res, next) => {
  try {
    const data = await tekmetricService.getCustomers(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/customers/:customerId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getCustomer(req.params.customerId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/customers', async (req, res, next) => {
  try {
    const data = await tekmetricService.createCustomer(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/customers/:customerId', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateCustomer(req.params.customerId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Vehicle Routes =====
router.get('/vehicles', async (req, res, next) => {
  try {
    const data = await tekmetricService.getVehicles(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/vehicles/:vehicleId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getVehicle(req.params.vehicleId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get vehicles for a specific customer
router.get('/customers/:customerId/vehicles', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const shopId = req.query.shop;
    
    console.log(`Fetching vehicles for customer ${customerId} in shop ${shopId}`);
    
    // Fetch vehicles with customer filter first
    let data = await tekmetricService.getVehicles({ shop: shopId, customer: customerId, size: 100 });
    let customerVehicles = Array.isArray(data) ? data : data.content || [];
    
    console.log(`Found ${customerVehicles.length} vehicles with customer parameter`);
    
    // If no vehicles found with customer parameter, fetch all and filter
    if (customerVehicles.length === 0) {
      console.log(`Trying to fetch all vehicles and filter...`);
      data = await tekmetricService.getVehicles({ shop: shopId, size: 1000 });
      const allVehicles = Array.isArray(data) ? data : data.content || [];
      console.log(`Total vehicles in shop: ${allVehicles.length}`);
      
      customerVehicles = allVehicles.filter(v => {
        const matches = v.customerId === parseInt(customerId);
        if (matches) {
          console.log(`Found matching vehicle:`, v.id, v.year, v.make, v.model);
        }
        return matches;
      });
      
      console.log(`Filtered to ${customerVehicles.length} vehicles for customer ${customerId}`);
    }
    
    res.json({
      content: customerVehicles,
      totalElements: customerVehicles.length
    });
  } catch (error) {
    console.error(`Error fetching vehicles for customer ${customerId}:`, error.message);
    next(error);
  }
});

router.post('/vehicles', async (req, res, next) => {
  try {
    const data = await tekmetricService.createVehicle(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/vehicles/:vehicleId', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateVehicle(req.params.vehicleId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Repair Order Routes =====
router.get('/repair-orders', async (req, res, next) => {
  try {
    const data = await tekmetricService.getRepairOrders(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/repair-orders/:repairOrderId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getRepairOrder(req.params.repairOrderId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/repair-orders', async (req, res, next) => {
  try {
    const data = await tekmetricService.createRepairOrder(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/repair-orders/:repairOrderId', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateRepairOrder(req.params.repairOrderId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Job Routes =====
router.get('/jobs', async (req, res, next) => {
  try {
    const data = await tekmetricService.getJobs(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getJob(req.params.jobId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/repair-orders/:repairOrderId/jobs', async (req, res, next) => {
  try {
    const data = await tekmetricService.getJobs({ repairOrderId: req.params.repairOrderId });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/repair-orders/:repairOrderId/jobs', async (req, res, next) => {
  try {
    const data = await tekmetricService.createJob(req.params.repairOrderId, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/jobs/:jobId', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateJob(req.params.jobId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/canned-jobs', async (req, res, next) => {
  try {
    const data = await tekmetricService.getCannedJobs(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/repair-orders/:repairOrderId/canned-jobs', async (req, res, next) => {
  try {
    const data = await tekmetricService.addCannedJobsToRO(req.params.repairOrderId, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/jobs/:jobId/job-clock', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateJobClock(req.params.jobId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/labor/:laborId', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateLabor(req.params.laborId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Inspection Routes =====
router.get('/inspections', async (req, res, next) => {
  try {
    const data = await tekmetricService.getInspections(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/inspections/:inspectionId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getInspection(req.params.inspectionId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Employee Routes =====
router.get('/employees', async (req, res, next) => {
  try {
    const data = await tekmetricService.getEmployees();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/employees/:employeeId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getEmployee(req.params.employeeId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Appointment Routes =====
router.get('/appointments', async (req, res, next) => {
  try {
    const data = await tekmetricService.getAppointments(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/appointments/:appointmentId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getAppointment(req.params.appointmentId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/appointments', async (req, res, next) => {
  try {
    const data = await tekmetricService.createAppointment(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/appointments/:appointmentId', async (req, res, next) => {
  try {
    const data = await tekmetricService.updateAppointment(req.params.appointmentId, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/appointments/:appointmentId', async (req, res, next) => {
  try {
    const data = await tekmetricService.deleteAppointment(req.params.appointmentId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== Inventory Routes =====
router.get('/inventory', async (req, res, next) => {
  try {
    const data = await tekmetricService.getInventory(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/inventory/:partId', async (req, res, next) => {
  try {
    const data = await tekmetricService.getInventoryPart(req.params.partId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
