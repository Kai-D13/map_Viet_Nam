const CountrySwitcher = ({ currentCountry }) => {
  const switchCountry = (country) => {
    const url = new URL(window.location);
    if (country === 'thailand') {
      url.searchParams.delete('country');
    } else {
      url.searchParams.set('country', country);
    }
    window.location.href = url.toString();
  };

  return (
    <div style={{
      position: 'absolute',
      top: '90px',
      right: '20px',
      zIndex: 1001,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => switchCountry('thailand')}
        style={{
          padding: '10px 20px',
          backgroundColor: currentCountry === 'thailand' ? '#4264fb' : '#fff',
          color: currentCountry === 'thailand' ? '#fff' : '#333',
          border: 'none',
          borderRight: '1px solid #dee2e6',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: currentCountry === 'thailand' ? 'bold' : 'normal',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (currentCountry !== 'thailand') {
            e.target.style.backgroundColor = '#f8f9fa';
          }
        }}
        onMouseLeave={(e) => {
          if (currentCountry !== 'thailand') {
            e.target.style.backgroundColor = '#fff';
          }
        }}
      >
        🇹🇭 Thailand
      </button>
      <button
        onClick={() => switchCountry('vietnam')}
        style={{
          padding: '10px 20px',
          backgroundColor: currentCountry === 'vietnam' ? '#4264fb' : '#fff',
          color: currentCountry === 'vietnam' ? '#fff' : '#333',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: currentCountry === 'vietnam' ? 'bold' : 'normal',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (currentCountry !== 'vietnam') {
            e.target.style.backgroundColor = '#f8f9fa';
          }
        }}
        onMouseLeave={(e) => {
          if (currentCountry !== 'vietnam') {
            e.target.style.backgroundColor = '#fff';
          }
        }}
      >
        🇻🇳 Vietnam
      </button>
    </div>
  );
};

export default CountrySwitcher;

