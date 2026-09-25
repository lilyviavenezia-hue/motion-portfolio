import { StrictMode, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Code2, ExternalLink, GraduationCap, Lightbulb, Mail, MapPin } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const FRAME_COUNT = 64;
const BACKGROUND = '#94150e';
const RESPONSE = 0.26;
const DEATH_RADIUS = 0.12;

function lerpAngle(current, target, amount) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * amount;
}

function CharacterCanvas({ onReady }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { alpha: false });
    const frames = Array.from({ length: FRAME_COUNT }, (_, index) => {
      const image = new Image();
      image.src = `/frames/frame-${String(index).padStart(2, '0')}.webp`;
      return image;
    });
    const center = new Image();
    center.src = '/frames/center.webp';
    let smoothAngle = -Math.PI / 2;
    let animationFrame;
    let viewWidth = 0;
    let viewHeight = 0;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      viewWidth = window.innerWidth;
      viewHeight = window.innerHeight;
      canvas.width = Math.floor(viewWidth * pixelRatio);
      canvas.height = Math.floor(viewHeight * pixelRatio);
      canvas.style.width = `${viewWidth}px`;
      canvas.style.height = `${viewHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawCover = (image) => {
      if (!image.complete || !image.naturalWidth) return;
      const scale = Math.max(viewWidth / image.naturalWidth, viewHeight / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.clearRect(0, 0, viewWidth, viewHeight);
      context.drawImage(image, (viewWidth - width) / 2, (viewHeight - height) / 2, width, height);
    };

    const render = () => {
      const { x, y, active } = pointerRef.current;
      const faceX = viewWidth * 0.5;
      const faceY = viewHeight * 0.43;
      const distance = Math.hypot(x - faceX, y - faceY);
      const radius = Math.min(viewWidth, viewHeight) * DEATH_RADIUS;
      const lookingCenter = !active || distance < radius;

      if (!lookingCenter) {
        const targetAngle = Math.atan2(y - faceY, x - faceX);
        smoothAngle = lerpAngle(smoothAngle, targetAngle, RESPONSE);
      }

      const frameIndex = Math.floor(((smoothAngle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * FRAME_COUNT) % FRAME_COUNT;
      const image = lookingCenter ? center : frames[frameIndex];
      drawCover(image);
      animationFrame = requestAnimationFrame(render);
    };

    const handlePointerMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    };
    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);
    Promise.all([...frames, center].map((image) => new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
    }))).then(() => {
      onReady();
      render();
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [onReady]);

  return <canvas ref={canvasRef} className="character-canvas" aria-label="Interactive character portrait" />;
}

function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    let frame;
    let pointer = { x: -100, y: -100 };
    let ring = { x: -100, y: -100 };
    const move = (event) => { pointer = { x: event.clientX, y: event.clientY }; };
    const render = () => {
      ring.x += (pointer.x - ring.x) * 0.16;
      ring.y += (pointer.y - ring.y) * 0.16;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      frame = requestAnimationFrame(render);
    };
    window.addEventListener('pointermove', move);
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); };
  }, []);

  return <div className={`cursor-layer ${interactive ? 'is-interactive' : ''}`}>
    <span ref={ringRef} className="cursor-ring" />
    <span ref={dotRef} className="cursor-dot" />
  </div>;
}

function App() {
  const [ready, setReady] = useState(false);
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Hello Lilyvia - ${formData.get('name')}`);
    const body = encodeURIComponent(`${formData.get('message')}\n\nReply to: ${formData.get('email')}`);
    window.location.href = `mailto:lilyviavenezia@gmail.com?subject=${subject}&body=${body}`;
  };

  return <main id="top">
    <section className="hero">
      <CharacterCanvas onReady={() => setReady(true)} />
      <div className={`loading-mark ${ready ? 'is-hidden' : ''}`} aria-hidden="true">L / 01</div>
      <header className="nav-pill">
        <a href="#work">[ WORK ]</a><a href="#about-details">[ ABOUT ]</a><a href="#contact">[ CONTACT ]</a>
      </header>
      <section className="intro" id="about">
        <p className="eyebrow">Hi, I'm</p>
        <h1>Lilyvia<span>.</span></h1>
        <p className="bio">A passionate Information Systems student turning thoughtful ideas into useful things for the web.</p>
        <div className="actions">
          <a className="button button-solid" href="#work">Explore my work <ArrowUpRight size={16} strokeWidth={1.8} /></a>
          <a className="button button-glass" href="#contact">Let's Talk <ArrowUpRight size={16} strokeWidth={1.8} /></a>
        </div>
      </section>
      <div className="folio"><span>SELECTED WORK</span><a href="#about-details">SCROLL TO EXPLORE ↓</a></div>
      <Cursor />
    </section>

    <section className="content-section about-section" id="about-details">
      <div className="section-label">01 / ABOUT ME</div>
      <div className="section-grid">
        <div>
          <p className="display-kicker">Curious by nature,<br /><em>creative by practice.</em></p>
          <p className="section-copy">Hello! I'm a passionate student at Universiti Teknologi PETRONAS (UTP), currently studying <strong>Bachelor of Information Systems (Hons)</strong>. I love building things for the web and turning ideas into reality with code.</p>
          <p className="section-copy">Outside of coding, I enjoy jogging and baking desserts. I am also a proud member of the Google Developer Student Club at UTP.</p>
        </div>
        <div className="fact-list">
          <div className="fact"><MapPin size={18} /><span><small>BASED IN</small>Perak, Malaysia</span></div>
          <div className="fact"><GraduationCap size={18} /><span><small>STUDYING AT</small>Universiti Teknologi PETRONAS</span></div>
          <div className="fact"><Lightbulb size={18} /><span><small>PASSIONATE ABOUT</small>Technology & digital experiences</span></div>
        </div>
      </div>
    </section>

    <section className="content-section skills-section" aria-labelledby="skills-title">
      <div className="section-label">02 / MY SKILLS</div>
      <div className="skills-heading"><h2 id="skills-title">Things I am learning<br /><em>to bring ideas to life.</em></h2><p>Technologies I learned and am currently learning.</p></div>
      <div className="skill-list">{['HTML5', 'CSS3', 'JavaScript', 'Flexbox', 'Git & GitHub', 'VS Code'].map((skill, index) => <span className="skill" key={skill}><b>0{index + 1}</b>{skill}</span>)}</div>
    </section>

    <section className="content-section work-section" id="work" aria-labelledby="work-title">
      <div className="section-label">03 / MY PROJECTS</div>
      <div className="work-heading"><h2 id="work-title">A small selection<br /><em>of things I've built.</em></h2><p>Things I've built during and after the workshop.</p></div>
      <article className="project-card">
        <div className="project-number">01</div>
        <div className="project-mark"><Code2 size={46} strokeWidth={1.2} /></div>
        <div className="project-info"><p className="project-type">PERSONAL PROJECT / 2026</p><h3>Personal Portfolio</h3><p>A responsive personal portfolio website built with HTML, CSS, and JavaScript during the GDSC-UTP Web Dev Workshop.</p><a className="text-link" href="#top">View Project <ArrowUpRight size={16} /></a></div>
      </article>
    </section>

    <section className="content-section contact-section" id="contact" aria-labelledby="contact-title">
      <div className="section-label">04 / GET IN TOUCH</div>
      <div className="contact-grid">
        <div><h2 id="contact-title">Have a question<br />or an <em>idea?</em></h2><p>Send me a message and let's make something thoughtful together.</p><div className="socials"><a href="mailto:lilyviavenezia@gmail.com" aria-label="Email Lilyvia"><Mail size={18} /></a><a href="https://github.com" target="_blank" rel="noreferrer" aria-label="Lilyvia on GitHub"><ExternalLink size={18} /></a><a href="https://linkedin.com/in/lilyvia-venezia-asun?utm_source=gemini" target="_blank" rel="noreferrer" aria-label="Lilyvia on LinkedIn"><ExternalLink size={18} /></a></div></div>
        <form className="contact-form" onSubmit={handleSubmit}><label>Your Name<input name="name" type="text" placeholder="How should I call you?" required /></label><label>Your Email<input name="email" type="email" placeholder="you@example.com" required /></label><label>Message<textarea name="message" rows="4" placeholder="Tell me a little about your idea..." required /></label><button className="button button-dark" type="submit">Send Message <Mail size={15} /></button></form>
      </div>
    </section>

    <footer><span>Made with care by <strong>Lilyvia Venezia Asun</strong></span><span>HTML · CSS · JavaScript</span></footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);