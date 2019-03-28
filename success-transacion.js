'use strict';

const Mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?replicaSet=${process.env.MONGO_REPLSET}`;
const Schema = Mongoose.Schema;
const Customer = Mongoose.model('Customer', new Schema({
  name: String
}));
let session = null;

Mongoose
  .connect(MONGO_URI, {
    authSource: process.env.MONGO_AUTHSOURCE,
    useNewUrlParser: true,
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 30
  })
  .then(connection => {
    console.log('Conexión exitosa a base de datos:', MONGO_URI);
    return Customer.createCollection();
  })
  .then(() => {
    console.log('Sesión iniciada');
    return Mongoose.startSession();
  })
  .then(_session => {
    session = _session;
    return Customer.create([{ name: 'Daniela' }]);
  })
  .then(customer => {
    console.log('Customer creado: ', customer);
    console.log('TRANSACCIÓN INICIADA.');
    session.startTransaction();
    return Customer.findOne({ name: 'Daniela' }).session(session);
  })
  .then(customer => {
    console.log('Costumer encontrado: ', customer);
    customer.name = 'Daniela Suárez';
    return customer.save();
  })
  .then(customer => {
    console.log('Customer guardado: ', customer);
  }) 
  .then(() => {
    console.log('TRANSACCIÓN CONFIRMADA.');
    session.commitTransaction();
    session.endSession();
    Mongoose.disconnect();
    process.exit(1);
  }) 
  .catch(err => {
    console.log('Connection error: ', err);
    if (session !== null) {
      console.log('Hay una sesión, abortando');
      session.abortTransaction();
      session.endSession();
    }
    Mongoose.disconnect();
  });