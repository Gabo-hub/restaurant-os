const API_BASE_URL = 'http://localhost:5000/api'; // Reemplaza con la URL de tu backend

class ApiService {
  constructor(token) {
    this.token = localStorage.getItem('token') || token;
  }

  async _fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Métodos para las mesas (Tables)
  getTables() {
    return this._fetch('/tables/');
  }

  getTablesCount() {
    return this._fetch('/statistics/tables/count');
  }

  createTable(tableData) {
    return this._fetch('/tables/', {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  }

  getTable(tableId) {
    return this._fetch(`/tables/${tableId}`);
  }

  updateTable(tableId, tableData) {
    return this._fetch(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify(tableData),
    });
  }

  deleteTable(tableId) {
    return this._fetch(`/tables/${tableId}`, {
      method: 'DELETE',
    });
  }

  claimTable(tableId, waiterUsername, guests) {
    return this._fetch(`/tables/${tableId}/claim`, {
      method: 'PATCH',
      body: JSON.stringify({ waiter_username: waiterUsername, guests: guests }),
    });
  }

  // Metodo para (Menus)

  getMenus() {
    return this._fetch('/menu/');
  }

  // Metodo para (Orders)

  getOrders() {
    return this._fetch('/orders/');
  }

  getOrdersByWaiter(waiterId, limit) {
    const queryParams = new URLSearchParams({
      limit: limit,
      id_waiter: waiterId
    }).toString();
    return this._fetch(`/orders/?${queryParams}`);
  }

  createOrder(orderData) {
    return this._fetch('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  getOrder(orderId) {
    return this._fetch(`/orders/${orderId}`);
  }

  updateOrder(orderId, orderData) {
    return this._fetch(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  deleteOrder(orderId) {
    return this._fetch(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  addItemToOrder(orderId, itemData) {
    return this._fetch(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  removeItemFromOrder(orderId, detailOrderId) {
    return this._fetch(`/orders/${orderId}/items/${detailOrderId}`, {
      method: 'DELETE',
    });
  }

  // Métodos para ventas (Sales)
  getSales() {
    return this._fetch('/sales/');
  }

  createSale(saleData) {
    return this._fetch('/sales/', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  getSale(saleId) {
    return this._fetch(`/sales/${saleId}`);
  }

  getSalesByCashier(cashierId) {
    return this._fetch(`/sales/cashier/${cashierId}`)
  }

  updateSale(saleId, saleData) {
    return this._fetch(`/sales/${saleId}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  deleteSale(saleId) {
    return this._fetch(`/sales/${saleId}`, {
      method: 'DELETE',
    });
  }

  // Metodos para type order
  getTypeOrders() {
    return this._fetch('/type_orders/');
  }

  addTypeOrder(typeOrderData) {
    return this._fetch('/type_orders/', {
      method: 'POST',
      body: JSON.stringify(typeOrderData),
    });
  }

  getTypeOrder(typeOrderId) {
    return this._fetch(`/type_orders/${typeOrderId}`);
  }

  updateTypeOrder(typeOrderId, typeOrderData) {
    return this._fetch(`/type_orders/${typeOrderId}`, {
      method: 'PUT',
      body: JSON.stringify(typeOrderData),
    });
  }

  deleteTypeOrder(typeOrderId) {
    return this._fetch(`/type_orders/${typeOrderId}`, {
      method: 'DELETE',
    });
  }

  // Métodos para estadísticas
  getStatisticsOverview(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/statistics/overview?${queryParams}` : '/statistics/overview';
    return this._fetch(endpoint);
  }

  getTablesOccupiedStatistics(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/tables/occupied/statistics?${queryParams}` : '/tables/occupied/statistics';
    return this._fetch(endpoint);
  }

  getOrdersStatusStatistics(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/statistics/orders/status?${queryParams}` : '/statistics/orders/status';
    return this._fetch(endpoint);
  }

  getSalesStatistics(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/statistics/sales?${queryParams}` : '/statistics/sales';
    return this._fetch(endpoint);
  }

  // Métodos para estadísticas por usuario específico
  getWaiterOrdersStatistics(waiterId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/orders/waiters/${waiterId}/statistics?${queryParams}`;
    return this._fetch(endpoint);
  }

  getWaiterTablesStatistics(waiterId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/tables/waiters/${waiterId}/statistics?${queryParams}`;
    return this._fetch(endpoint);
  }

}

export default ApiService;
