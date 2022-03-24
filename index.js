const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const userRoute = require('./routes/user');
const authRoute = require('./routes/auth');
const productRoute = require('./routes/product');
const cartRoute = require('./routes/cart');
const orderRoute = require('./routes/order');
const stripeRoute = require('./routes/stripe');
dotenv.config();

//DB CONNECTION
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('Mongo connection successfull'))
  .catch((error) => console.log(error));
/////////////////////////////////////////////////////////////
let options = {
  origin: '*',
};
app.use(cors(options));
app.use(express.json());
app.use('/api/auth/', authRoute);
app.use('/api/users/', userRoute);
app.use('/api/products', productRoute);
app.use('/api/carts', cartRoute);
app.use('/api/orders', orderRoute);
app.use('/api/checkout', stripeRoute);

//PORT CONNECTION///////////////////////////////////////

app.listen(process.env.PORT || 4000, () => {
  console.log('connected to server');
});
