import { Link } from 'react-router-dom';
import './HeroBanner.scss';

const HeroBanner = ({ title, subtitle, ctaText, ctaLink, image, isVideo = false, videoSrc }) => {
  return (
    <section className="hero-banner">
      <div className="hero-banner__media">
        {isVideo && videoSrc ? (
          <video
            className="hero-banner__video"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <div
            className="hero-banner__image"
            style={{ backgroundImage: `url(${image})` }}
          />
        )}
      </div>

      <div className="hero-banner__content">
        <div className="hero-banner__container">
          {subtitle && <p className="hero-banner__subtitle">{subtitle}</p>}
          <h1 className="hero-banner__title">{title}</h1>
          <Link to={ctaLink} className="btn btn--white hero-banner__cta">
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
