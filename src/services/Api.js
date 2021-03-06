'use strict';

import axios from 'axios';
import crypto from 'crypto';

const AppSettings = require('../../app-settings.json');

const hashSomething = (str) => {
    return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * 
 */
class Api {
    constructor() {
        if (process.env.NODE_ENV && process.env.NODE_ENV==='development') {
            this.url = AppSettings.api_dev;
        } else {
            this.url = AppSettings.api;
        }
        axios.defaults.baseURL = this.url;
        axios.defaults.timeout = 5000;
        axios.defaults.headers = {'Access-Control-Allow-Origin': '*'};
    }
    getAuthToken(token, uid) {
        const timestamp = new Date().getTime();
        return uid + ':' + timestamp + ':' + hashSomething(timestamp + token);
    }

    getAxiosAuth(token, uid) {
        if (!token || !uid) {
            throw Error('Unauthorized');
        }
        return axios.create({
            baseURL: this.url,
            timeout: 5000,
            withCredentials: false,
            headers: {
                'Authorization': 'token ' + this.getAuthToken(token, uid), 
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    async checkConnection() {
        const response = await axios.get('/');
        return response.data ? response.data.result : false;
    }

    /**
     * @param {*} response 
     */
    parseResponse(response) {
        if (response && response.data && response.data.result) {
            return response.data;
        } else {
            throw Error(response && response.data && response.data.message ? response.data.message : 'API result is false');
        }
    }

    async checkAuth(token, uid) {
        console.debug('BotApi.checkAuth', token, uid);
        if (!token || !uid) {
            throw Error('Unauthorized');
        }
        const response = await this.getAxiosAuth(token, uid).get('/user/me');
        return this.parseResponse(response);
    }

    async register(form) {
        if (!form.email || !form.name || !form.password) {
            throw Error('Some form fields is empty');
        }
        const response = await axios.put('/user/register', form);
        return this.parseResponse(response);
    }

    async login(form) {
        if (!form.email || !form.password) {
            throw Error('Some form fields is empty');
        }
        const response = await axios.post('/user/login', form);
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     */
    async loadBills(token, uid) {
        const response = await this.getAxiosAuth(token, uid).get('/bills');
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     */
    async createBill(token, uid, name) {
        const response = await this.getAxiosAuth(token, uid).put('/bill', {
            name: name
        });
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} billId 
     */
    async deleteBill(token, uid, billId) {
        const response = await this.getAxiosAuth(token, uid).delete('/bill/' + billId);
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} billId 
     * @param {*} chargeAmount 
     */
    async createRevision(token, uid, billId, chargeAmount) {
        const response = await this.getAxiosAuth(token, uid).put('/bill/' + billId + '/revisions', {
            charge_amount: chargeAmount
        });
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} billId 
     * @param {*} fromDate 
     */
    async loadBillRevisions(token, uid, billId, fromDate) {
        const response = await this.getAxiosAuth(token, uid).get('/bill/' + billId + '/revisions/' + fromDate);
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} fromDate 
     */
    async loadAllRevisions(token, uid, fromDate) {
        const response = await this.getAxiosAuth(token, uid).get('/bills/revisions/' + fromDate);
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} billId 
     */
    async declineLastRevision(token, uid, billId) {
        const response = await this.getAxiosAuth(token, uid).delete('/bill/' + billId + '/revision');
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} sourceBillId 
     * @param {*} targetBillId 
     * @param {*} amount 
     */
    async transfer(token, uid, sourceBillId, targetBillId, amount) {
        const response = await this.getAxiosAuth(token, uid)
            .post('/bill/transfer/' + sourceBillId + '/' + targetBillId + '/', {
                amount: amount
            });
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} name 
     */
    async createGroup(token, uid, name, color, includedBills, mainBill, proportion) {
        const response = await this.getAxiosAuth(token, uid)
            .put('/bill/groups/', {
                name: name,
                color: color,
                included_bills: includedBills,
                main_bill_id: mainBill,
                proportion: proportion
            });
        return this.parseResponse(response);
    }

    
    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} name 
     */
    async updateGroup(token, uid, groupId, name, color, includedBills, mainBill, proportion) {
        const response = await this.getAxiosAuth(token, uid)
            .post('/bill/group/' + groupId, {
                name: name,
                color: color,
                included_bills: includedBills,
                main_bill_id: mainBill,
                proportion: proportion
            });
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     */
    async getGroups(token, uid) {
        const response = await this.getAxiosAuth(token, uid).get('/bill/groups/');
        return this.parseResponse(response);
    }

    /**
     * @param {*} token 
     * @param {*} uid 
     * @param {*} groupId 
     */
    async deleteBillGroup(token, uid, groupId) {
        const response = await this.getAxiosAuth(token, uid)
            .delete('/bill/group/' + groupId);
        return this.parseResponse(response);
    }
}

export default new Api;
