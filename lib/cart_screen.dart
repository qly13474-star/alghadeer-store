my husband:
import 'package:flutter/material.dart';

class CartScreen extends StatefulWidget {
  final List<Map<String, String>> cartItems;

  const CartScreen({Key? key, required this.cartItems}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  String _deliveryType = 'دراجة نارية (للطلبات الخفيفة)';

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    double total = 0.0;
    for (var item in widget.cartItems) {
      String priceStr = item['price'] ?? '0';
      double price = double.tryParse(priceStr.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
      total += price;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('سلة الطلبات وإتمام التوصيل - الغدير'),
        centerTitle: true,
      ),
      body: widget.cartItems.isEmpty
          ? const Center(
              child: Text(
                'السلة فارغة حالياً',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'المنتجات المختارة:',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: widget.cartItems.length,
                    itemBuilder: (context, index) {
                      final item = widget.cartItems[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: ListTile(
                          title: Text(item['name'] ?? ''),
                          subtitle: Text(item['price'] ?? ''),
                          trailing: const Icon(Icons.shopping_bag, color: Colors.blue),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 30, thickness: 2),
                  const Text(
                    'معلومات العميل وتفاصيل التوصيل:',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'اسم الزيون الكامل',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'رقم الهاتف للتواصل',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      labelText: 'العنوان بالتفصيل (المنطقة، الاقرب نقطة دالة)',

border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_on),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'اختر وسيلة النقل المناسبة:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  DropdownButtonFormField<String>(
                    value: _deliveryType,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.local_shipping),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'دراجة نارية (للطلبات الخفيفة)',
                        child: Text('دراجة نارية (للطلبات الخفيفة والإكسسوارات)'),
                      ),
                      DropdownMenuItem(
                        value: 'سيارة نقل كبيرة (للأثاث والأجهزة الضخمة)',
                        child: Text('سيارة نقل كبيرة (للأثاث والأجهزة الضخمة)'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _deliveryType = value!;
                      });
                    },
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
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
                        const SizedBox(height: 15),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            onPressed: () {
                              if (_nameController.text.isEmpty ||
                                  _phoneController.text.isEmpty ||
                                  _addressController.text.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('يرجى ملء جميع حقول الاسم ورقم الهاتف والعنوان'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                                return;
                              }

                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('تم إرسال طلبك بنجاح'),
                                  content: Text(

'شكراً لتسوقك في متجر الغدير!\n\n'
                                    'الاسم: ${_nameController.text}\n'
                                    'الهاتف: ${_phoneController.text}\n'
                                    'العنوان: ${_addressController.text}\n'
                                    'وسيلة النقل: $_deliveryType\n\n'
                                    'سيتم تحويل الطلب إلى قسم التوصيل المختص وسيتصل بك المندوب قريباً.',
                                  ),
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
                              'إرسال الطلب وتأكيد التوصيل',
                              style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
