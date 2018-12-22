export default (response)  => {
    if (Array.isArray(response)) {
        return response.map( item => (
            {...item, type: item.access ? 'Access' : item.uplink ? 'Network' : undefined}
        ));
    }
}