const path = require('path');
const auth = require('http-auth');
const basic = auth.basic({
    file: path.join(__dirname, '../users.htpasswd'),
});

const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator/check');

const router = express.Router();
const Registration = mongoose.model('Registration');

router.get('/',
    (req, res) => {
        res.render('form', { title: 'Pembelian Pulsa' });
    }
);

router.get('/registrations', auth.connect(basic), (req, res) => {
    Registration.find()
        .then((registrations) => {
            res.render('index', { title: 'Riwayat Pembelian Pulsa', registrations });
        })
        .catch(() => { res.send('Sorry! Something went wrong.'); });
});

router.post('/',
    [
    body('operator')
        .isLength({ min: 1 })
        .withMessage('Input nama operator'),
    body('phone')
        .isLength({ min: 1 })
        .withMessage('Input nomor HP anda'),
    body('denom')
        .isLength({ min: 1 })
        .withMessage('Input pembelian pulsa anda'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
            
            //Transfer ke API
            // Send a POST request
            
            //REQUEST
            const request = require("request");
            //console.log(process.env.SECRET);
            var options = {
                method: 'POST',
                uri: 'https://api.pulsatop.com/partner/business/order',
                qs: { key: process.env.KEY },
                headers: {
                    'Cache-Control': 'no-cache',
                    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
                },
                formData: { 
                    operator: req.body.operator,
                    phone: req.body.phone,
                    secret: process.env.SECRET,
                    denom: req.body.denom 
                } 
            };

            console.log(options.formData);

            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                
                console.log('errornya karena ', error);
                console.log('statusCode-nya adalah ', response && response.statusCode);
                console.log(body);
            });

            //Simpan transaksi ke dalam database
            const registration = new Registration(req.body); 
            registration.save() 
                .then(() => { res.send('Terimakasih untuk pembeliannya!'); }) 
                .catch(() => { res.send('Maaf pembelian gagal'); }); 
            
        } else {
            res.render('form', {
                title: 'Pembelian Pulsa',
                errors: errors.array(),
                data: req.body,
            });
        }
    }
);

module.exports = router;