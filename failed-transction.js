'use strict';

const Mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?replicaSet=${process.env.MONGO_REPLSET}`;
const Customer = Mongoose.model('Customer', new Schema({
  name: String
}));
let session = null;

Mongoose
  .connect(MONGO_URI, {
    authSource: 'admin',
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
    console.log('Iniciando sesión ...');
    return Mongoose.startSession();
  })
  .then(_session => {
    let customer = new Customer();
    customer.name = 'Jonathan';
    session = _session;
    //Se inicia la transacción, desde aqui hasta que se termine, si es confirmada o abortada se hace la escritura o el rollback
    console.log('TRANSACCIÓN INICIADA.')
    session.startTransaction();
    //Se debe poner entre [] de lo contrario crea dos registros
    return Customer.create([{ name: 'Daniela' }], {session: session});
  })
  .then((customer) => {
    console.log('Customer creado: ', customer);;
    return Customer.findOne({_id: Mongoose.Types.ObjectId(customer[0]._id)}).session(session);
  })
  .then(customer => {
    console.log('Customer encontrado: ', customer);
    customer.name = 'Daniela Suárez';
    return customer.save();
  })
  .then(customer => {
    console.log('Customer guardado: ', customer);
    console.log('TRANSACCION ABORTADA.');
    session.abortTransaction();
    session.endSession();
    Mongoose.disconnect();
    process.exit(0);
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