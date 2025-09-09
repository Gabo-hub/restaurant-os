
const API_BASE_URL = 'https://182vv9td-5000.use2.devtunnels.ms/api'; // Reemplaza con la URL de tu backend

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

  claimTable(tableId, waiterUsername) {
    return this._fetch(`/tables/${tableId}/claim`, {
      method: 'PATCH',
      body: JSON.stringify({ waiter_username: waiterUsername }),
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

}

export default ApiService;
