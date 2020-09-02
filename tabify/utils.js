const getFECHeatmapColorValue = (key) => {
    return !key ? 'EMPTY' : key >= 0.0 && key < 0.5 ? '0.0% - 0.499%' : key >= 0.5 && key < 2.0 ? '0.5% - 1.99%' : key >= 2.0 && key < 4.0 ? '2.0% - 3.99%' : key >= 4.0 && key < 10.0 ? '4.0% - 9.99%' : '>= 10.0%';
};
