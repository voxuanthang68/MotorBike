const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/contracts
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'customer') query.customer = req.user._id;
    const contracts = await Contract.find(query)
      .populate('customer', 'fullName email phone')
      .populate('vehicle', 'name licensePlate brand')
      .populate('signedByStaff', 'fullName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/contracts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('customer', 'fullName email phone cccd drivingLicense address')
      .populate('vehicle', 'name licensePlate brand model color')
      .populate('booking')
      .populate('signedByStaff', 'fullName email');
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
    res.json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/contracts - Create from booking
router.post('/', protect, authorize('owner', 'admin', 'receptionist'), async (req, res) => {
  try {
    const { bookingId, termsAndConditions } = req.body;
    const booking = await Booking.findById(bookingId)
      .populate('customer')
      .populate('vehicle');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt xe.' });

    const contract = await Contract.create({
      booking: bookingId,
      customer: booking.customer._id,
      vehicle: booking.vehicle._id,
      customerInfo: {
        fullName: booking.customer.fullName,
        cccd: booking.customer.cccd,
        drivingLicense: booking.customer.drivingLicense,
        phone: booking.customer.phone,
        address: booking.customer.address,
        email: booking.customer.email
      },
      vehicleInfo: {
        name: booking.vehicle.name,
        licensePlate: booking.vehicle.licensePlate,
        brand: booking.vehicle.brand,
        model: booking.vehicle.model,
        color: booking.vehicle.color
      },
      startDate: booking.startDate,
      endDate: booking.endDate,
      rentalDays: booking.totalDays,
      pricePerDay: booking.pricePerDay,
      totalRentalFee: booking.totalPrice,
      depositAmount: booking.deposit,
      discountAmount: booking.discountAmount,
      totalPayable: booking.finalPrice,
      paymentMethod: booking.paymentMethod,
      termsAndConditions,
      status: 'pending_signature',
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Tạo hợp đồng thành công.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/contracts/:id/sign - Customer signs
router.put('/:id/sign', protect, async (req, res) => {
  try {
    const { customerSignature, staffSignature } = req.body;
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    if (customerSignature) {
      contract.customerSignature = customerSignature;
      contract.customerSignedAt = new Date();
    }
    if (staffSignature && ['owner', 'admin', 'receptionist'].includes(req.user.role)) {
      contract.staffSignature = staffSignature;
      contract.staffSignedAt = new Date();
      contract.signedByStaff = req.user._id;
    }

    if (contract.customerSignature && contract.staffSignature) {
      contract.status = 'active';
    }

    await contract.save();
    res.json({ success: true, message: 'Ký hợp đồng thành công.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
