<template>
  <v-app id="inspire">
    <v-app-bar app dark dense>
      <v-btn icon @click="onClickHome">
        <v-icon>mdi-backspace</v-icon>
      </v-btn>
      <v-toolbar-title>Money Allocation</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid ref="container" v-if="$store.getters.getCurrentBill">
      
        <v-row align="start" justify="center">
          <v-col cols="12" class="text-left">
            <h3>Bill - {{$store.getters.getCurrentBill.name}}</h3>
          </v-col>
        </v-row>

        <v-row>
            <v-col>
                <v-btn-toggle
                    dense
                    dark
                    multiple
                    >
                    <v-btn @click="onClickNewCharge"  title="Charge funds to bill">
                      <v-icon>mdi-plus-minus</v-icon> Charge
                    </v-btn>
                    <v-btn @click="onClickNewRevision" title="Set current bill balance">
                      <v-icon>mdi-credit-card-clock</v-icon> Revision
                    </v-btn>
                    <v-btn title="Transfer funds to another bill" :disabled="!$store.getters.getLastRevision || $store.getters.getBills.length < 2" @click="onClickTransfer">
                      <v-icon>mdi-transfer-right</v-icon>  Transfer
                    </v-btn>
                    <v-btn @click="onClickDeleteBill" title="Delete this bill">
                      <v-icon>mdi-close</v-icon> Delete
                    </v-btn>
                    <v-btn :disabled="!$store.getters.getLastRevision || $store.getters.getBillRevisions.length === 1" @click="onClickDeclineLastRevision">
                      <v-icon>mdi-cancel</v-icon> Decline last revision
                    </v-btn>
                </v-btn-toggle>
            </v-col>
        </v-row>

        <v-row align="start" justify="start">
            <v-col cols="8">
                <v-list class="transparent">
                    <v-list-item dense>
                        <v-list-item-title>id</v-list-item-title>
                        <v-list-item-title>{{$store.getters.getCurrentBill.id}}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="$store.getters.getLastRevision" dense>
                        <v-list-item-title>Last revision date</v-list-item-title>
                        <v-list-item-title>{{formatDate($store.getters.getLastRevision.inserted_at)}}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="$store.getters.getLastRevision" dense>
                        <v-list-item-title>Last revision amount</v-list-item-title>
                        <v-list-item-title>{{$store.getters.getLastRevision.charge_amount}}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="$store.getters.getLastRevision" dense>
                        <v-list-item-title>Balance</v-list-item-title>
                        <v-list-item-title :class="{'success--text': $store.getters.getLastRevision.balance_amount > 0, 'red--text': $store.getters.getLastRevision.balance_amount < 0}">{{$store.getters.getLastRevision.balance_amount}}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-col>
        </v-row>

        <v-row align="start" justify="center" v-if="$store.getters.getBillRevisions.length > 1">
          <v-col>
          <v-card
            class="mt-4 mx-auto"
          >
            <v-sheet
              class="v-sheet--offset mx-auto"
              elevation="12"
            >
              <v-sparkline
                :labels="chartLabels"
                :value="chartValues"
                :gradient="['#00c6ff', '#F0F', '#FF0']"
                gradient-direction="top"
                line-width="1"
                labelSize="3"
                radius="10"
                padding="8"
              ></v-sparkline>
            </v-sheet>

          </v-card>
</v-col>
        </v-row>

        <v-row>
          <v-col  cols="10">
            <v-list class="transparent">
              <v-subheader>Revisions</v-subheader>
              <v-list-item  >
                  <v-list-item-title>id</v-list-item-title>
                  <v-list-item-title>date</v-list-item-title>
                  <v-list-item-title>charged</v-list-item-title>
                  <v-list-item-title>balance</v-list-item-title>
              </v-list-item>
              <v-list-item dense v-for="item in $store.getters.getBillRevisions" :key="item.id" >
                  <v-list-item-title>{{item.id}}</v-list-item-title>
                  <v-list-item-title>{{formatDate(item.inserted_at)}}</v-list-item-title>
                  <v-list-item-title>{{item.charge_amount}}</v-list-item-title>
                  <v-list-item-title>{{item.balance_amount}}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

      </v-container>
    </v-main>

    <v-footer fixed app class="d-flex flex-row justify-center">
    </v-footer>
        
    <v-snackbar
      top
      color="red darken-4"
      v-model="errorMessage.flag"
      :timeout="5000"
    >
      {{ errorMessage.text }}
    </v-snackbar>
  </v-app>

</template>

<script>
export default {
    data: () => ({
        id: null,
        errorMessage: {
            flag: false,
            text: ''
        }
    }),
    computed: {
      chartValues() {
        return this.$store.getters.getBillRevisions.map(item => parseFloat(item.balance_amount));
      },
      chartLabels() {
        return this.$store.getters.getBillRevisions.map(item => item.balance_amount);
      }
    },
    mounted: function() {
        this.id = this.$router.currentRoute.params.id;
        if (!this.id) {
          this.$router.push({ name: 'Home' });
        }
        this.$store.dispatch('setCurrentBill', {
            id: this.id
        })
        .then(() => {
            if (!this.$store.getters.getCurrentBill) {
                this.$router.push({ name: 'Home' });
            }
            this.$store.dispatch('loadBillRevisions', {
                billId: this.id
            }).catch(this.onError);
        })
        .catch(this.onError);
    },
    methods: {
      onClickHome() {
        this.$router.push({ name: 'Home' });
      },
      onClickNewRevision() {
          this.$router.push({ name: 'Forms', params: { 
            formId: 'addRevision', 
            billId: this.id,
            balance: this.$store.getters.getLastRevision ? this.$store.getters.getLastRevision.balance_amount : 0
          } })
      },
      onClickNewCharge() {
        this.$router.push({ name: 'Forms', params: { 
            formId: 'chargeFunds', 
            billId: this.id,
            balance: this.$store.getters.getLastRevision ? this.$store.getters.getLastRevision.balance_amount : 0
          } })
      },
      onClickDeclineLastRevision() {
        this.$store.dispatch('declineLastRevision', {
            billId: this.id
        }).catch(this.onError);
      },
      onClickDeleteBill() {
          this.$store.dispatch('deleteBill', {
            billId: this.id
        })
        .then(() => {
            this.$router.push({ name: 'Home' });
        })
        .catch(this.onError);
      },
      onClickTransfer() {
        this.$router.push({ 
          name: 'Forms', 
          params: { 
            formId: 'transfer', 
            sourceBill: this.$store.getters.getCurrentBill,
            balance: this.$store.getters.getLastRevision.balance_amount,
            bills: this.$store.getters.getBills.filter(item => item.id !== this.$store.getters.getCurrentBill.id)
          } 
        })
      },
      formatDate(dateStr) {
        let dt = new Date(dateStr);
        return dt.toLocaleString();
      },
      onError(e) {
        this.errorMessage.flag = true;
        this.errorMessage.text = e.message;
        if (e.message === 'Token expired') {
          this.$timer.start('onClickLogout');
        }
      }
    }
}
</script>
