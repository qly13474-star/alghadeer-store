import 'package:flutter/material.dart';

class CartScreen extends StatelessWidget {
  final List<Map<String, String>> cartItems;

  const CartScreen({Key? key, required this.cartItems}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    double total = 0.0;
    for (var item in cartItems) {
      String priceStr = item['price'] ?? '0';
      double price = double.tryParse(priceStr.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
      total += price;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('سلة الطلبات - الغدير'),
        centerTitle: true,
      ),
      body: cartItems.isEmpty
          ? const Center(
              child: Text(
                'السلة فارغة حالياً',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: cartItems.length,
                    itemBuilder: (context, index) {
                      final item = cartItems[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: ListTile(
                          title: Text(item['name'] ?? ''),
                          subtitle: Text(item['price'] ?? ''),
                          trailing: const Icon(Icons.shopping_bag, color: Colors.blue),
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.grey[200],
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'المجموع الكلي:',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '$total د.ع',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('تم إرسال الطلب'),
                                content: const Text('شكراً لتسوقك في متجر الغدير! سيتم التواصل معك قريباً لتأكيد التوصيل.'),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(context);
                                      Navigator.pop(context);
                                    },
                                    child: const Text('حسناً'),
                                  ),
                                ],
                              ),
                            );
                          },
                          child: const Text(
                            'تأكيد وإرسال الطلب',
                            style: TextStyle(fontSize: 16, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
