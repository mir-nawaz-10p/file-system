'use strict';

module.exports = function(req, res, next) {
  if (false) {
    res.status(500).send('Name exists');
  }
  res.json(req.body);
};
