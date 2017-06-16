const util = require('util');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const url = require('url');

admin.initializeApp(functions.config().firebase);

exports.analytics = functions.https.onRequest(function (req, res) {
    console.log(req.headers, req.body);
    cors(req, res, () => {
        try {
            if (!req.body || !req.body.name || !req.body.payload) {
                return res.send('');
            }

            var referer = url.parse(req.get('referer'));
            var host = referer.hostname.replace(/^(www\.)/i, '').replace(/\./gi, '_');
            var timestamp = new Date().toString();
            var analytic = {
                source: req.get('x-forwarded-for') || req.connection.remoteAddress,
                headers: req.headers,
                payload: req.body.payload
            };

            var siteRef = admin.database().ref('/analytics/' + req.body.name + '/' + req.body.function + '/' + host + '/' + timestamp).update(analytic).then((response) => {
                console.log('Updated analytics', response);
                res.send('');
            }).catch((err) => {
                console.error('Failed to update analytics', err);
                res.json(err);
            });
        } catch (err) {
            console.error(err);
            res.json(err);
        }
    });
});