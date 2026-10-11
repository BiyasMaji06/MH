const express = require('express');
const router = express.Router();
const abhaDatabase = require('../data/abhaDatabase');

const otpStore = new Map();

function cleanABHAId(id) {
  return String(id || '').replace(/\D/g, '');
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateABHAId() {
  let id;

  do {
    id = Array.from({ length: 14 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
  } while (abhaDatabase.find(user => user.abhaId === id));

  return id;
}

function maskMobile(mobile) {
  const value = String(mobile || '');
  return `${value.slice(0, 2)}******${value.slice(-2)}`;
}

router.post('/create', (req, res) => {
  const {
    name,
    yearOfBirth,
    gender,
    state,
    district,
    mobile,
    email,
  } = req.body;

  if (
    !name ||
    !yearOfBirth ||
    !gender ||
    !state ||
    !district ||
    !mobile
  ) {
    return res.status(400).json({
      message: 'Please provide all required details.',
    });
  }

  const cleanMobile = String(mobile).replace(/\D/g, '');

  if (cleanMobile.length !== 10) {
    return res.status(400).json({
      message: 'Mobile number must contain 10 digits.',
    });
  }

  const year = Number(yearOfBirth);

  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
    return res.status(400).json({
      message: 'Please enter a valid year of birth.',
    });
  }

  const profile = {
    abhaId: generateABHAId(),
    name: String(name).trim(),
    yearOfBirth: year,
    gender: String(gender).trim(),
    state: String(state).trim(),
    district: String(district).trim(),
    mobile: cleanMobile,
    email: String(email || '').trim(),
  };

  const saved = abhaDatabase.addProfile(profile);

  if (!saved) {
    return res.status(409).json({
      message: 'Unable to create this ABHA profile.',
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Test ABHA profile created successfully.',
    profile,
  });
});

router.post('/request-otp', (req, res) => {
  const abhaId = cleanABHAId(req.body.abhaId);

  if (abhaId.length !== 14) {
    return res.status(400).json({
      message: 'ABHA ID must contain 14 digits.',
    });
  }

  const user = abhaDatabase.find(
    item => item.abhaId === abhaId
  );

  if (!user) {
    return res.status(404).json({
      message: 'ABHA ID not found in test database.',
    });
  }

  const otp = generateOTP();

  otpStore.set(abhaId, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  console.log(`[DEMO OTP] ABHA ${abhaId}: ${otp}`);

  return res.json({
    success: true,
    message: 'OTP generated successfully.',
    demoOtp: otp,
    mobile: maskMobile(user.mobile),
  });
});

router.post('/verify-otp', (req, res) => {
  const abhaId = cleanABHAId(req.body.abhaId);
  const otp = String(req.body.otp || '');
  const stored = otpStore.get(abhaId);

  if (!stored) {
    return res.status(400).json({
      message: 'OTP not requested.',
    });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(abhaId);

    return res.status(400).json({
      message: 'OTP has expired.',
    });
  }

  if (stored.otp !== otp) {
    return res.status(401).json({
      message: 'Incorrect OTP.',
    });
  }

  otpStore.delete(abhaId);

  const user = abhaDatabase.find(
    item => item.abhaId === abhaId
  );

  if (!user) {
    return res.status(404).json({
      message: 'ABHA profile not found.',
    });
  }

  return res.json({
    success: true,
    profile: {
      abhaId: user.abhaId,
      name: user.name,
      yearOfBirth: user.yearOfBirth,
      gender: user.gender,
      state: user.state,
      district: user.district,
    },
  });
});

router.get('/', (req, res) => {
  return res.json(abhaDatabase.getAll());
});

router.get('/:abhaId', (req, res) => {
  const abhaId = cleanABHAId(req.params.abhaId);

  const user = abhaDatabase.find(
    item => item.abhaId === abhaId
  );

  if (!user) {
    return res.status(404).json({
      message: 'ABHA ID not found.',
    });
  }

  return res.json({
    abhaId: user.abhaId,
    name: user.name,
    yearOfBirth: user.yearOfBirth,
    gender: user.gender,
    state: user.state,
    district: user.district,
  });
});

module.exports = router;