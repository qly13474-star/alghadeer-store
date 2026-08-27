
import 'package:flutter/material.dart';

class ProductsScreen extends StatelessWidget {
  final String categoryName;

  const ProductsScreen({Key? key, required this.categoryName}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // قائمة منتجات تجريبية حسب القسم
    final List<Map<String, String>> products = _getProductsForCategory(categoryName);

    return Scaffold(
      appBar: AppBar(
        title: Text(categoryName),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: GridView.builder(
          itemCount: products.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.75,
          ),
          itemBuilder: (context, index) {
            final product = products[index];
            return Card(
              elevation: 3,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Container(
                      color: Colors.grey[200],
                      child: const Center(
                        child: Icon(Icons.image, size: 50, color: Colors.grey),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product['name']!,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          product['price']!,
                          style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('تمت إضافة ${product['name']} إلى السلة')),
                              );
                            },
                            child: const Text('إضافة للسلة', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  List<Map<String, String>> _getProductsForCategory(String category) {
    if (category.contains('الأجهزة')) {
      return [
        {'name': 'غسالة ملابس ذكية', 'price': '350,000 د.ع'},
        {'name': 'ثلاجة بابين حديثة', 'price': '650,000 د.ع'},
        {'name': 'مكيف هواء انفرتر', 'price': '500,000 د.ع'},
      ];
    } else if (category.contains('المطبخ')) {
      return [
        {'name': 'طباخ غازي أمان تام', 'price': '220,000 د.ع'},
        {'name': 'فرن كهربائي مدمج', 'price': '180,000 د.ع'},

{'name': 'مجموعة قدور ستيل', 'price': '75,000 د.ع'},
      ];
    } else if (category.contains('الأخشاب')) {
      return [
        {'name': 'تخم ديوان منزلي فاخر', 'price': '450,000 د.ع'},
        {'name': 'غرفة نوم كاملة', 'price': '950,000 د.ع'},
        {'name': 'جرباية أطفال خشبية', 'price': '120,000 د.ع'},
      ];
    } else {
      return [
        {'name': 'منتج عام متوفر', 'price': '50,000 د.ع'},
      ];
    }
  }
}
