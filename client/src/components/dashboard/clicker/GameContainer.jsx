// In the return statement of GameContainer.jsx

    return (
        <div 
            className="card" 
            style={{ border: '5px solid limegreen', minHeight: '80vh', padding: '1rem' }}
        >
            <h1 style={{ color: 'white', textAlign: 'center' }}>GameContainer is visible!</h1>
            <div className="clicker-container">
                <Hud />
                <BossDisplay />
                <AbilityBar />
                <ShopArea />
            </div>
        </div>
    );
