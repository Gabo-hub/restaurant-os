const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`; // Base URL configurable

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

    // Normaliza posibles dobles slashes en la URL final (excepto el esquema)
    const url = `${API_BASE_URL}${endpoint}`.replace(/([^:]\/)\/+/g, '$1');

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError) {
      throw new Error(`Network error while requesting ${url}: ${networkError.message}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || errorData.message || JSON.stringify(errorData) || response.statusText;
        throw new Error(`API ${response.status} ${response.statusText}: ${message}`);
      } else {
        const text = await response.text();
        throw new Error(`API ${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
      }
    }

    if (contentType.includes('application/json')) {
      return response.json();
    } else {
      const text = await response.text();
      throw new Error(`Expected JSON response but received: ${text.slice(0, 200)}`);
    }
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
