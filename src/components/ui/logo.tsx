

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`logo ${className}`}>
      <span className="logo-text">MyApp</span>
    </div>
  );
};

export default Logo;