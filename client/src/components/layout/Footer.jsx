import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiChevronDown } from 'react-icons/fi';
import './Footer.scss';

const Footer = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const footerLinks = {
    about: {
      title: 'About',
      links: [
        { name: 'Careers', href: '#' },
        { name: 'Company', href: '#' },
        { name: 'Corporate News', href: '#' },
        { name: 'Investors', href: '#' },
        { name: 'Press Center', href: '#' },
        { name: 'Sustainability', href: '#' },
      ],
    },
    explore: {
      title: 'Explore',
      links: [
        { name: 'Gift Cards', href: '#' },
        { name: 'Store Locator', href: '#' },
        { name: 'Student Discount', href: '#' },
        { name: 'Military & First Responders', href: '#' },
      ],
    },
    support: {
      title: 'Support',
      links: [
        { name: 'Contact Us', href: '#' },
        { name: 'FAQ', href: '#' },
        { name: 'Gift Card Balance', href: '#' },
        { name: 'Return Policy', href: '#' },
        { name: 'Shipping and Delivery', href: '#' },
        { name: 'Size Guide', href: '#' },
      ],
    },
  };

  return (
    <footer className="footer">
      <div className="footer__newsletter">
        <div className="footer__container">
          <h3 className="footer__newsletter-title">Stay up to date</h3>
          <p className="footer__newsletter-text">
            Sign up for our newsletter and get 15% off your first order.
          </p>
          <form className="footer__newsletter-form">
            <input
              type="email"
              placeholder="Email address"
              className="footer__newsletter-input"
            />
            <button type="submit" className="btn btn--white">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="footer__main">
        <div className="footer__container">
          <div className="footer__grid">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="footer__section">
                <button
                  className="footer__section-header"
                  onClick={() => toggleSection(key)}
                >
                  <h4 className="footer__section-title">{section.title}</h4>
                  <FiChevronDown
                    className={`footer__section-icon ${openSection === key ? 'footer__section-icon--open' : ''}`}
                  />
                </button>
                <ul className={`footer__section-list ${openSection === key ? 'footer__section-list--open' : ''}`}>
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href} className="footer__link">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="footer__section">
              <h4 className="footer__section-title">Follow Us</h4>
              <div className="footer__social">
                <a href="#" className="footer__social-link" aria-label="Facebook">
                  <FiFacebook size={20} />
                </a>
                <a href="#" className="footer__social-link" aria-label="Instagram">
                  <FiInstagram size={20} />
                </a>
                <a href="#" className="footer__social-link" aria-label="Twitter">
                  <FiTwitter size={20} />
                </a>
                <a href="#" className="footer__social-link" aria-label="YouTube">
                  <FiYoutube size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__container">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} Two-step Athletics, Inc. All Rights Reserved.
          </p>
          <div className="footer__legal">
            <Link to="/privacy" className="footer__legal-link">Privacy Policy</Link>
            <Link to="/terms" className="footer__legal-link">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
