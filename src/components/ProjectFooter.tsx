import {
  AI_ASSISTED_DEVELOPMENT_URL,
  CATALOG_LICENSE_URL,
  CATALOG_REPOSITORY_URL,
  PROJECT_REPOSITORY_URL
} from '../config';

const externalLinkProps = {
  target: '_blank',
  rel: 'noreferrer'
} as const;

const ProjectFooter = () => (
  <footer className="project-footer" aria-label="Projektinformationen">
    <p className="project-footer-primary">
      <strong>Grundschutz++ Explorer</strong>
      <span aria-hidden="true"> · </span>
      Sebastian Göttel
      <span aria-hidden="true"> · </span>
      <a href={PROJECT_REPOSITORY_URL} {...externalLinkProps}>
        GitHub-Repository
      </a>
      <span aria-hidden="true"> · </span>
      <a href={AI_ASSISTED_DEVELOPMENT_URL} {...externalLinkProps}>
        Mit Unterstützung von KI-Werkzeugen entwickelt.
      </a>
    </p>
    <p>
      Unabhängiges Community-Projekt. Nicht im Auftrag des BSI und keine
      offizielle BSI-Anwendung. Katalogdaten: Bundesamt für Sicherheit in der
      Informationstechnik (BSI),{' '}
      <a href={CATALOG_REPOSITORY_URL} {...externalLinkProps}>
        Stand-der-Technik-Bibliothek
      </a>
      ,{' '}
      <a href={CATALOG_LICENSE_URL} {...externalLinkProps}>
        CC BY-SA 4.0
      </a>
      .
    </p>
  </footer>
);

export default ProjectFooter;
