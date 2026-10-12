import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import policies from '../data/policies';
import storeInfo from '../data/storeInfo';
import usePageTitle from '../hooks/usePageTitle';
import '../styles/InfoPages.css';

const PolicyPage = () => {
  const { pathname } = useLocation();
  const policy = policies[pathname.replace(/^\//, '')];
  usePageTitle(policy ? policy.title : 'Policy', policy ? policy.intro : undefined);

  if (!policy) return null;
  return (
    <div className="info-page">
      <div className="info-container">
        <nav className="info-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>{policy.title}</span></nav>
        <h1>{policy.title}</h1>
        <p className="info-updated">Last updated: {storeInfo.lastUpdated}</p>
        <p className="info-lead">{policy.intro}</p>
        {policy.sections.map((section) => (
          <section key={section.heading} className="info-section">
            <h2>{section.heading}</h2>
            {section.body.length > 1 ? (
              <ul>{section.body.map((line) => <li key={line}>{line}</li>)}</ul>
            ) : (
              <p>{section.body[0]}</p>
            )}
          </section>
        ))}
        <p className="info-more">See also: {Object.entries(policies).filter(([path]) => `/${path}` !== pathname).map(([path, p], i, arr) => (
          <React.Fragment key={path}><Link to={`/${path}`}>{p.title}</Link>{i < arr.length - 1 ? ' · ' : ''}</React.Fragment>
        ))}</p>
      </div>
    </div>
  );
};

export default PolicyPage;
