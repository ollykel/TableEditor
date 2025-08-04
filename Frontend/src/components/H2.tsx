const H2 = (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) => {
  const { className: inheritedClassName, children } = props;

  let className = 'text-xl font-semibold font-serif text-center mb-2';

  if (inheritedClassName) {
    className += ' ' + inheritedClassName;
  }

  return (
    <h2
      {...props}
      className={className}
    >
      {children}
    </h2>
  );
};

export default H2;
