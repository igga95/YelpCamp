const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
	res.render('users/register');
};

module.exports.registerUser = async (req, res, next) => {
	try {
		const { username, email, password } = req.body;
		const user = new User({ username, email });
		const registeredUser = await User.register(user, password);
		req.login(registeredUser, err => {
			if (err) return next(err);
			req.flash('success', 'Welcome to Yelp Camp!');
			res.redirect('/campgrounds');
		});
	} catch (e) {
		req.flash('error', e.message);
		res.redirect('/register')
	}
};

module.exports.renderLogin = (req, res) => {
	res.render('users/login');
};

module.exports.loginUser = (req, res) => {
	req.flash('success', 'Welcome Back!');
	const redirectUrl = req.session.returnTo || '/campgrounds';
	delete req.session.returnTo;
	res.redirect(redirectUrl);
};

module.exports.logoutUser = (req, res) => {
	req.logout();
	req.flash('success', 'Bye');
	res.redirect('/campgrounds');
};