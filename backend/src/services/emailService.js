class EmailService {
  async sendInvite() {
    return true;
  }
  async sendBulkInvites() {
    return true;
  }
  async sendEventReminder() {
    return true;
  }
  isConfigured() {
    return true;
  }
}

module.exports = new EmailService(); 