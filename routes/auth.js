const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const nodemailer = require('nodemailer');
//REGISTER
router.post('/register', async (req, res) => {
  console.log('entered registration');

  const newUser = await new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString(),
  });
  try {
    const savedUser = await newUser.save();
    console.log('registered');
    res.status(200).json(savedUser);
  } catch (error) {
    res.status(500).send('Error in Registration');
  }
});

//LOGIN

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(401).json('Email doesnt exists');

    const hashedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    );

    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

    originalPassword != req.body.password &&
      res.status(401).json('wrong password');

    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SEC,
      { expiresIn: '30d' }
    );

    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, accessToken });
    // res.status(200).json('Sucessfully Logged in ...');
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post('/forgetpassword', async (req, res) => {
  console.log('before printing email');
  console.log(req.body);
  const user = await User.findOne({ email: req.body.email });
  !user && res.status(401).json('Email doesnt exists');
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const token = buffer.toString('hex');
    console.log(token);
    user.resetToken = token;
    user.expireToken = Date.now() + 3600000;

    user
      .save()
      .then((result) => {
        let mailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'noreply.mail123321@gmail.com',
            pass: 'Mailer123!',
          },
        });

        let mailDetails = {
          from: 'noreply.mail123321@gmail.com',
          to: 'josephvijayj17bca015@gmail.com',
          subject: 'Forget password',
          html: `<a href="http://localhost:3000/resetpassword/${token}">Password reset link ...</a>`,
        };

        mailTransporter.sendMail(mailDetails, function (err, data) {
          if (err) {
            console.log('Error Occurs', err);
            res.json(err);
          } else {
            res.status(200).json('Email sent successfully');
          }
        });
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  });
});

router.put('/resetpassword', async (req, res) => {
  const { password, token } = req.body;
  console.log(token);
  const user = await User.findOne({ resetToken: token });
  if (user) {
    user.password = CryptoJS.AES.encrypt(
      password,
      process.env.PASS_SEC
    ).toString();
    await user.save();
    res.json('Password Changed Successfully');
  } else {
    return res.status(400).json('token doesnt exists');
  }
});

module.exports = router;
