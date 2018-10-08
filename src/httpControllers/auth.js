
import manager from '../services/auth';

export const register = (req, res) => {
  manger.register(req.body.id, req.body.password)
  .then((token) => {
    res.status(200).json({
      token,
      auth: true
    })
  })
  .catch((err) => {
    res.status(403).json({auth: false, err})
  });
}

export const login = (req, res) => {
  manager.login(req.body.storyId, req.body.password)
  .then((token) => {
    res.status(200).json({token, auth: true})
  })
  .catch((err) => {
    res.status(403).json({auth: false, err})
  });
}

export const resetPassword = (req, res) => {
  manager.resetPassword(req.body.storyId, req.body.oldPassword, req.body.newPassword)
  .then((token) => {
    res.status(200).json({token, auth: true})
  })
  .catch((err) => {
    res.status(403).json({auth: false, err})
  });
}

export const verifyToken = (req, res, next) => {
  // check header or url parameters or post parameters for token
  const token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({auth: false, message:'No token provided'});

  // verifies secret and checks exp
  manager.checkToken(token, (err) => {
    if (err)
      return res.status(403).send({auth: false, message:'Invalid token'});
    next();
  });
}
